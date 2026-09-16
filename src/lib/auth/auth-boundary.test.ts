import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";

const mockHeaders = vi.fn();
const mockCreateServerSupabaseClient = vi.fn();
const mockCreateClient = vi.fn();

vi.mock("next/headers", () => ({
  headers: () => mockHeaders(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => mockCreateServerSupabaseClient(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

vi.mock("@/lib/env/public", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env/public")>();
  return {
    ...actual,
    isPublicSupabaseConfigured: () => true,
    requirePublicSupabaseEnv: () => ({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    }),
  };
});

const mockGetCurrentProfile = vi.fn();

vi.mock("@/lib/auth/get-current-profile", () => ({
  getCurrentProfile: () => mockGetCurrentProfile(),
}));

vi.mock("@/server/services/catalog/product-service", () => ({
  listPublicProducts: vi.fn().mockResolvedValue({
    data: [],
    pagination: {
      page: 1,
      pageSize: 24,
      total: 0,
      totalPages: 0,
    },
  }),
}));

import { extractBearerToken, readBearerTokenFromHeaders } from "@/lib/auth/bearer-token";
import { requireApiAuth } from "@/lib/auth/api-guard";
import { resolveRequestAuth } from "@/lib/auth/request-auth";
import { GET as listProducts } from "@/app/api/v1/products/route";

const testUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "mobile@example.com",
} as User;

const testProfile = {
  id: "22222222-2222-4222-8222-222222222222",
  userId: testUser.id,
  role: "customer" as const,
  firstName: "Mobile",
  lastName: "User",
  phone: null,
  avatarUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function mockCookieClient(user: User | null, error: Error | null = null) {
  mockCreateServerSupabaseClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error,
      }),
    },
  });
}

function mockBearerClient(user: User | null, error: Error | null = null) {
  const getUser = vi.fn().mockResolvedValue({
    data: { user },
    error,
  });
  mockCreateClient.mockReturnValue({
    auth: { getUser },
  });
  return getUser;
}

describe("bearer token parsing", () => {
  it("extracts a bearer token from Authorization headers", () => {
    expect(extractBearerToken("Bearer access-token-123")).toBe("access-token-123");
    expect(extractBearerToken("bearer access-token-123")).toBe("access-token-123");
    expect(
      readBearerTokenFromHeaders(
        new Headers({ authorization: "Bearer mobile-jwt" }),
      ),
    ).toBe("mobile-jwt");
  });

  it("ignores missing, blank, or non-bearer headers", () => {
    expect(extractBearerToken(null)).toBeNull();
    expect(extractBearerToken("Basic abc")).toBeNull();
    expect(extractBearerToken("Bearer   ")).toBeNull();
    expect(
      readBearerTokenFromHeaders(new Headers()),
    ).toBeNull();
  });
});

describe("resolveRequestAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(new Headers());
  });

  it("prefers cookie sessions for web callers", async () => {
    mockCookieClient(testUser);

    const auth = await resolveRequestAuth();

    expect(auth).toEqual({
      user: testUser,
      accessToken: null,
      method: "cookie",
    });
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("accepts a valid bearer token when no cookie session exists", async () => {
    mockCookieClient(null);
    mockHeaders.mockResolvedValue(
      new Headers({ authorization: "Bearer valid-token" }),
    );
    const getUser = mockBearerClient(testUser);

    const auth = await resolveRequestAuth();

    expect(auth).toEqual({
      user: testUser,
      accessToken: "valid-token",
      method: "bearer",
    });
    expect(getUser).toHaveBeenCalledWith("valid-token");
  });

  it("rejects invalid bearer tokens", async () => {
    mockCookieClient(null);
    mockHeaders.mockResolvedValue(
      new Headers({ authorization: "Bearer expired-token" }),
    );
    mockBearerClient(null, new Error("invalid JWT"));

    const auth = await resolveRequestAuth();

    expect(auth).toEqual({
      user: null,
      accessToken: null,
      method: null,
    });
  });

  it("returns unauthenticated when no cookie or bearer is present", async () => {
    mockCookieClient(null);

    const auth = await resolveRequestAuth();

    expect(auth).toEqual({
      user: null,
      accessToken: null,
      method: null,
    });
  });
});

describe("requireApiAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(new Headers());
    mockGetCurrentProfile.mockResolvedValue(testProfile);
  });

  it("returns 401 when unauthenticated", async () => {
    mockCookieClient(null);

    const auth = await requireApiAuth();

    expect(auth.ok).toBe(false);
    if (!auth.ok) {
      expect(auth.response.status).toBe(401);
    }
  });

  it("returns 401 for invalid bearer tokens", async () => {
    mockCookieClient(null);
    mockHeaders.mockResolvedValue(
      new Headers({ authorization: "Bearer bad-token" }),
    );
    mockBearerClient(null, new Error("invalid JWT"));

    const auth = await requireApiAuth();

    expect(auth.ok).toBe(false);
    if (!auth.ok) {
      expect(auth.response.status).toBe(401);
    }
  });

  it("allows authenticated cookie sessions", async () => {
    mockCookieClient(testUser);

    const auth = await requireApiAuth();

    expect(auth.ok).toBe(true);
    if (auth.ok) {
      expect(auth.user.id).toBe(testUser.id);
      expect(auth.profile.role).toBe("customer");
    }
  });

  it("allows authenticated bearer sessions", async () => {
    mockCookieClient(null);
    mockHeaders.mockResolvedValue(
      new Headers({ authorization: "Bearer valid-token" }),
    );
    mockBearerClient(testUser);

    const auth = await requireApiAuth();

    expect(auth.ok).toBe(true);
    if (auth.ok) {
      expect(auth.user.id).toBe(testUser.id);
    }
  });
});

describe("public catalog routes", () => {
  it("does not require authentication", async () => {
    const response = await listProducts(
      new Request("http://localhost/api/v1/products"),
    );

    expect(response.status).toBe(200);
  });
});
