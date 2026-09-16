import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { canAccessAdmin, hasMinRole, hasStaffAccess, isAdmin, isManager } from "@/lib/auth/permissions";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import {
  resolvePostgresPoolMax,
  redactSecrets,
  runtimePostgresOptions,
  classifyPostgresHostname,
  describePostgresTarget,
  assertRuntimeDatabaseUrl,
  assertMigrationDatabaseUrl,
  requireDirectDatabaseUrl,
  formatSafePostgresTarget,
} from "@/lib/env/postgres";
import { consumeRateLimit, resetRateLimitStore } from "@/lib/http/rate-limit";
import { securityHeaders } from "@/lib/http/security-headers";
import { sanitizeAuditMetadata } from "@/lib/admin/audit";
import { createSafeStorageFileName, isAllowedImageMimeType } from "@/lib/supabase/storage";
import { checkoutBodySchema } from "@/lib/validation/checkout";
import { createProductSchema, updateProductSchema } from "@/lib/validation/catalog";
import { verifyPaymentBodySchema } from "@/lib/validation/payments";
import { adjustInventorySchema } from "@/lib/validation/inventory";

afterEach(() => {
  resetRateLimitStore();
});

describe("connection pool", () => {
  it("keeps vitest at one connection unless overridden", () => {
    expect(resolvePostgresPoolMax(undefined, { VITEST: "true" })).toBe(1);
    expect(runtimePostgresOptions.max).toBe(1);
    expect(runtimePostgresOptions.prepare).toBe(false);
    expect(runtimePostgresOptions.ssl).toBe("require");
  });

  it("uses a conservative production default and caps the ceiling", () => {
    expect(resolvePostgresPoolMax(undefined, { NODE_ENV: "production" })).toBe(4);
    expect(resolvePostgresPoolMax("3", { NODE_ENV: "production" })).toBe(3);
    expect(resolvePostgresPoolMax("99", { NODE_ENV: "production" })).toBe(8);
    expect(resolvePostgresPoolMax("0", { NODE_ENV: "production" })).toBe(4);
  });
});

describe("runtime vs migration postgres URIs", () => {
  const pooler =
    "postgresql://app_user:secret-pass@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";
  const direct = "postgresql://app_user:secret-pass@db.exampleproject.supabase.co:5432/postgres";
  const wrongPort = "postgresql://app_user:secret-pass@postgres.internal-example:5432/";

  it("classifies pooler, direct, and other hosts without needing credentials", () => {
    expect(classifyPostgresHostname("aws-0-ap-south-1.pooler.supabase.com")).toBe("supabase-pooler");
    expect(classifyPostgresHostname("db.exampleproject.supabase.co")).toBe("supabase-direct-db");
    expect(classifyPostgresHostname("postgres")).toBe("literal-postgres");
    expect(classifyPostgresHostname("127.0.0.1")).toBe("localhost");
  });

  it("reports only safe metadata for a transaction pooler URI", () => {
    const target = describePostgresTarget(pooler, 4);
    expect(target).toEqual({
      hostnameCategory: "supabase-pooler",
      port: 6543,
      databaseName: "postgres",
      poolMax: 4,
      isTransactionPooler: true,
      isDirectSession: false,
    });
    const safe = formatSafePostgresTarget(target);
    expect(safe).toContain("port=6543");
    expect(safe).not.toContain("secret-pass");
    expect(safe).not.toContain("app_user");
    expect(safe).not.toContain("postgresql://");
  });

  it("accepts a pooler URI at runtime and rejects a direct URI in production", () => {
    expect(
      assertRuntimeDatabaseUrl(pooler, { NODE_ENV: "production" }, 4).isTransactionPooler,
    ).toBe(true);
    expect(() =>
      assertRuntimeDatabaseUrl(direct, { NODE_ENV: "production" }, 4),
    ).toThrow(/hostnameCategory=supabase-direct-db/);
    expect(() =>
      assertRuntimeDatabaseUrl(direct, { NODE_ENV: "production" }, 4),
    ).not.toThrow(/secret-pass|app_user|postgresql:\/\//);
  });

  it("warns instead of throwing on a 5432 runtime URI outside production", () => {
    const target = assertRuntimeDatabaseUrl(wrongPort, { NODE_ENV: "development" }, 4);
    expect(target.isTransactionPooler).toBe(false);
    expect(target.port).toBe(5432);
    expect(target.databaseName).toBe("(missing)");
  });

  it("requires DIRECT_DATABASE_URL for migrations and rejects the pooler port", () => {
    expect(() => requireDirectDatabaseUrl(undefined)).toThrow(/DIRECT_DATABASE_URL is required/);
    expect(assertMigrationDatabaseUrl(direct).isDirectSession).toBe(true);
    expect(() => assertMigrationDatabaseUrl(pooler)).toThrow(/not the transaction pooler/);
  });

  it("keeps request-path code on DATABASE_URL only", () => {
    const runtime = readFileSync(path.join(process.cwd(), "src/db/index.ts"), "utf8");
    const kit = readFileSync(path.join(process.cwd(), "drizzle.config.ts"), "utf8");
    expect(runtime).toContain("env.DATABASE_URL");
    expect(runtime).not.toContain("env.DIRECT_DATABASE_URL");
    expect(runtime).toContain("runtimePostgresOptions");
    expect(kit).toContain("requireDirectDatabaseUrl");
    expect(kit).not.toContain("process.env.DATABASE_URL");
    const serverEnv = readFileSync(path.join(process.cwd(), "src/lib/env/server.ts"), "utf8");
    expect(serverEnv).not.toContain("DIRECT_DATABASE_URL");
  });
});

describe("rate limiting", () => {
  it("allows up to the limit then rejects", () => {
    expect(consumeRateLimit("login:1", 2, 60_000, 1_000).ok).toBe(true);
    expect(consumeRateLimit("login:1", 2, 60_000, 1_001).ok).toBe(true);
    expect(consumeRateLimit("login:1", 2, 60_000, 1_002).ok).toBe(false);
  });
});

describe("security headers", () => {
  it("sets production headers including HSTS and a Razorpay-compatible CSP", () => {
    const keys = securityHeaders(true).map((header) => header.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "Content-Security-Policy",
        "X-Content-Type-Options",
        "X-Frame-Options",
        "Referrer-Policy",
        "Permissions-Policy",
        "Strict-Transport-Security",
      ]),
    );
    const csp = securityHeaders(true).find((header) => header.key === "Content-Security-Policy")?.value ?? "";
    expect(csp).toContain("checkout.razorpay.com");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(securityHeaders(false).some((header) => header.key === "Strict-Transport-Security")).toBe(false);
  });
});

describe("open redirects", () => {
  it("rejects absolute, protocol-relative, and javascript next values", () => {
    expect(getSafeRedirectPath("https://evil.example")).toBe("/account");
    expect(getSafeRedirectPath("//evil.example")).toBe("/account");
    expect(getSafeRedirectPath("javascript:alert(1)")).toBe("/account");
    expect(getSafeRedirectPath("/admin/products")).toBe("/admin/products");
  });
});

describe("rbac matrix", () => {
  it("matches customer/staff/manager/admin access", () => {
    expect(canAccessAdmin("customer")).toBe(false);
    expect(hasStaffAccess("staff")).toBe(true);
    expect(isManager("staff")).toBe(false);
    expect(hasMinRole("staff", "manager")).toBe(false);
    expect(isManager("manager")).toBe(true);
    expect(isAdmin("admin")).toBe(true);
    expect(hasMinRole("customer", "staff")).toBe(false);
  });
});

describe("mass assignment and price authority", () => {
  it("rejects client-controlled money, role, and inventory fields", () => {
    expect(
      createProductSchema.safeParse({
        name: "Tee",
        slug: "tee",
        basePrice: "1499.00",
        role: "admin",
        createdAt: "2020-01-01T00:00:00.000Z",
      }).success,
    ).toBe(false);
    expect(updateProductSchema.safeParse({ status: "archived" }).success).toBe(true);
    expect(
      checkoutBodySchema.safeParse({
        addressId: "11111111-1111-4111-8111-111111111111",
        idempotencyKey: "22222222-2222-4222-8222-222222222222",
        totalAmount: "1.00",
        userId: "11111111-1111-4111-8111-111111111111",
      }).success,
    ).toBe(false);
    expect(
      verifyPaymentBodySchema.safeParse({
        razorpayPaymentId: "pay_1",
        razorpayOrderId: "order_1",
        razorpaySignature: "sig",
        amount: 1,
        paymentStatus: "paid",
      }).success,
    ).toBe(false);
    expect(
      adjustInventorySchema.safeParse({
        delta: 1,
        onHand: 99,
        reserved: 0,
      }).success,
    ).toBe(false);
  });
});

describe("uploads", () => {
  it("strips path traversal and executable extensions", () => {
    expect(isAllowedImageMimeType("image/png")).toBe(true);
    expect(isAllowedImageMimeType("application/javascript")).toBe(false);
    expect(createSafeStorageFileName("../../etc/passwd.php")).toMatch(/^[0-9a-f-]{36}\.bin$/);
    expect(createSafeStorageFileName("photo.JPEG")).toMatch(/^[0-9a-f-]{36}\.jpg$/);
  });
});

describe("logging and audit sanitization", () => {
  it("redacts connection strings and secret-like metadata", () => {
    expect(redactSecrets("postgres://user:hunter2@db.example/app")).toBe(
      "postgresql://[redacted]@db.example/app",
    );
    const clean = sanitizeAuditMetadata({
      sku: "TEE",
      razorpayKeySecret: "nope",
      password: "nope",
    });
    expect(clean.sku).toBe("TEE");
    expect(clean).not.toHaveProperty("password");
    expect(clean).not.toHaveProperty("razorpayKeySecret");
  });
});

describe("client bundle and env example", () => {
  it("does not put server secrets in public env or client modules", () => {
    const example = readFileSync(path.join(process.cwd(), ".env.example"), "utf8");
    expect(example).toContain("NEXT_PUBLIC_SUPABASE_URL=");
    expect(example).toContain("SUPABASE_SERVICE_ROLE_KEY=");
    expect(example).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY=.+/);
    expect(example).not.toMatch(/NEXT_PUBLIC_SUPABASE_SERVICE_ROLE/);
    expect(example).not.toMatch(/NEXT_PUBLIC_RAZORPAY_KEY_SECRET/);
    const files = [
      "src/lib/env/public.ts",
      "src/lib/supabase/browser.ts",
      "src/lib/api/client.ts",
      "src/lib/api/admin.ts",
      "src/features/checkout/checkout-client.tsx",
    ];
    for (const file of files) {
      const src = readFileSync(path.join(process.cwd(), file), "utf8");
      expect(src).not.toContain("process.env.SUPABASE_SERVICE_ROLE_KEY");
      expect(src).not.toContain("process.env.RAZORPAY_KEY_SECRET");
      expect(src).not.toContain("process.env.DATABASE_URL");
    }
  });
});

describe("smoke flow contracts", () => {
  it("customer checkout still requires only address and idempotency", () => {
    expect(
      checkoutBodySchema.safeParse({
        addressId: "11111111-1111-4111-8111-111111111111",
        idempotencyKey: "22222222-2222-4222-8222-222222222222",
      }).success,
    ).toBe(true);
  });

  it("admin mutations remain manager-gated in policy", () => {
    expect(isManager("staff")).toBe(false);
    expect(isManager("manager")).toBe(true);
    expect(canAccessAdmin("admin")).toBe(true);
  });
});
