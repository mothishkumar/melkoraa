import {
  ApiClientError,
  AuthSessionExpiredError,
} from "@/src/api/errors";
import {
  apiPage,
  apiRequest,
  setAccessTokenProvider,
  setSessionHandlers,
} from "@/src/api/client";

jest.mock("@/src/config/env", () => ({
  env: {
    apiUrl: "https://api.test.example/api/v1",
  },
}));

function jsonResponse(
  body: unknown,
  ok = true,
  status = ok ? 200 : 401,
): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

describe("apiRequest", () => {
  const fetchMock = jest.fn<Promise<Response>, [string, RequestInit?]>();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    setAccessTokenProvider(null);
    setSessionHandlers(null, null);
  });

  it("builds URLs from EXPO_PUBLIC_API_URL and sends JSON Accept header", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { ok: true } }));

    await apiRequest("/health");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.test.example/api/v1/health",
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/json",
        }),
      }),
    );
  });

  it("sends Authorization Bearer for authenticated requests", async () => {
    setAccessTokenProvider(async () => "mobile-access-token");
    fetchMock.mockResolvedValue(jsonResponse({ data: { id: "user-1" } }));

    await apiRequest("/auth/me", { authenticated: true });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer mobile-access-token");
  });

  it("does not send Authorization for public catalog requests", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        data: [],
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      }),
    );

    await apiPage("/products", { page: 1 }, false);

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it("refreshes once and retries after a 401", async () => {
    const refresh = jest.fn().mockResolvedValue("refreshed-token");
    const clear = jest.fn();
    setAccessTokenProvider(async () => "expired-token");
    setSessionHandlers(refresh, clear);

    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(
          { error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
          false,
          401,
        ),
      )
      .mockResolvedValueOnce(jsonResponse({ data: { id: "cart-1" } }));

    const result = await apiRequest<{ id: string }>("/cart", {
      authenticated: true,
    });

    expect(result).toEqual({ id: "cart-1" });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(clear).not.toHaveBeenCalled();
  });

  it("clears session when refresh cannot recover from a 401", async () => {
    const refresh = jest.fn().mockResolvedValue(null);
    const clear = jest.fn().mockResolvedValue(undefined);
    setAccessTokenProvider(async () => "expired-token");
    setSessionHandlers(refresh, clear);

    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
        false,
        401,
      ),
    );

    await expect(
      apiRequest("/cart", { authenticated: true }),
    ).rejects.toBeInstanceOf(AuthSessionExpiredError);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it("does not retry more than once even if the refreshed token is still rejected", async () => {
    const refresh = jest.fn().mockResolvedValue("still-invalid");
    const clear = jest.fn();
    setAccessTokenProvider(async () => "expired-token");
    setSessionHandlers(refresh, clear);

    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
        false,
        401,
      ),
    );

    await expect(
      apiRequest("/cart", { authenticated: true }),
    ).rejects.toBeInstanceOf(ApiClientError);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(clear).not.toHaveBeenCalled();
  });

  it("maps POST bodies to JSON requests", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { ok: true } }));

    await apiRequest("/cart/items", {
      method: "POST",
      authenticated: true,
      body: JSON.stringify({ variantId: "variant-1", quantity: 1 }),
    });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    );
  });

  it("surfaces non-auth API errors without refresh", async () => {
    const refresh = jest.fn();
    setSessionHandlers(refresh, jest.fn());

    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: { code: "FORBIDDEN", message: "Denied." } },
        false,
        403,
      ),
    );

    await expect(
      apiRequest("/admin", { authenticated: true }),
    ).rejects.toBeInstanceOf(ApiClientError);

    expect(refresh).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
