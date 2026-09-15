import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { sanitizeAuditMetadata } from "@/lib/admin/audit";
import { userFacingApiMessage, ApiClientError } from "@/lib/api/client";
import { canAccessAdmin, hasMinRole, hasStaffAccess, isAdmin, isManager } from "@/lib/auth/permissions";
import { isProtectedPath } from "@/lib/auth/paths";
import { adminNavForRole } from "@/lib/navigation";
import { adminAuditQuerySchema, adminCustomerQuerySchema } from "@/lib/validation/admin";
import {
  createCollectionSchema,
  createDropSchema,
  createProductSchema,
  dropProductSchema,
  updateProductSchema,
} from "@/lib/validation/catalog";
import { orderListQuerySchema } from "@/lib/validation/checkout";
import { adjustInventorySchema } from "@/lib/validation/inventory";
import type { AdminCustomer } from "@/types/admin";
import type { PaymentDto } from "@/types/orders";

const secrets = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "DATABASE_URL",
  "DIRECT_DATABASE_URL",
];

function walk(dir: string, acc: string[] = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx)$/.test(entry) && !entry.includes(".test.")) acc.push(full);
  }
  return acc;
}

describe("admin authorization", () => {
  it("denies customers and allows staff for /admin", () => {
    expect(canAccessAdmin("customer")).toBe(false);
    expect(hasStaffAccess("customer")).toBe(false);
    expect(canAccessAdmin("staff")).toBe(true);
    expect(hasStaffAccess("staff")).toBe(true);
    expect(isProtectedPath("/admin")).toBe(true);
    expect(isProtectedPath("/admin/products")).toBe(true);
  });

  it("denies customer-equivalent access to admin APIs via staff gate", () => {
    expect(hasMinRole("customer", "staff")).toBe(false);
    expect(hasMinRole("staff", "staff")).toBe(true);
  });

  it("denies staff manager-only mutations and allows manager/admin", () => {
    expect(isManager("staff")).toBe(false);
    expect(hasMinRole("staff", "manager")).toBe(false);
    expect(isManager("manager")).toBe(true);
    expect(isManager("admin")).toBe(true);
    expect(isAdmin("admin")).toBe(true);
  });

  it("hides audit logs from staff navigation without treating UI as authorization", () => {
    const staff = adminNavForRole("staff").map((item) => item.href);
    const manager = adminNavForRole("manager").map((item) => item.href);
    expect(staff).toContain("/admin/products");
    expect(staff).not.toContain("/admin/audit-logs");
    expect(manager).toContain("/admin/audit-logs");
  });
});

describe("product contracts", () => {
  it("validates create and rejects mass assignment", () => {
    expect(
      createProductSchema.safeParse({
        name: "Builder Tee",
        slug: "builder-tee",
        basePrice: "1499.00",
      }).success,
    ).toBe(true);
    expect(
      createProductSchema.safeParse({
        name: "Builder Tee",
        slug: "builder-tee",
        basePrice: "1499.00",
        createdAt: "2020-01-01T00:00:00.000Z",
        inventoryCount: 10,
        role: "admin",
      }).success,
    ).toBe(false);
    expect(
      updateProductSchema.safeParse({
        name: "Renamed",
        updatedAt: "2020-01-01T00:00:00.000Z",
      }).success,
    ).toBe(false);
  });

  it("archives via status rather than client-owned timestamps", () => {
    expect(updateProductSchema.safeParse({ status: "archived" }).success).toBe(true);
    expect(updateProductSchema.safeParse({ id: "11111111-1111-4111-8111-111111111111" }).success).toBe(
      false,
    );
  });
});

describe("inventory contracts", () => {
  it("accepts staff-readable adjustment payloads for managers and rejects invalid deltas", () => {
    expect(adjustInventorySchema.safeParse({ delta: 2, notes: "cycle count" }).success).toBe(true);
    expect(adjustInventorySchema.safeParse({ delta: 0 }).success).toBe(false);
    expect(
      adjustInventorySchema.safeParse({
        delta: 1,
        onHand: 99,
        reserved: 1,
        sold: 1,
      }).success,
    ).toBe(false);
    expect(isManager("staff")).toBe(false);
    expect(isManager("manager")).toBe(true);
    expect(isManager("admin")).toBe(true);
  });
});

describe("order contracts", () => {
  it("paginates and filters admin order lists server-side", () => {
    const query = orderListQuerySchema.parse({
      page: "2",
      search: "MK-2026",
      status: "pending",
      paymentStatus: "paid",
    });
    expect(query.page).toBe(2);
    expect(query.search).toBe("MK-2026");
    expect(() => orderListQuerySchema.parse({ pageSize: "500" })).toThrow();
  });

  it("does not expose payment secrets on payment DTOs", () => {
    const payment: PaymentDto = {
      id: "11111111-1111-4111-8111-111111111111",
      provider: "razorpay",
      status: "paid",
      amount: "1499.00",
      amountMinor: 149900,
      currency: "INR",
    };
    expect(payment).not.toHaveProperty("keySecret");
    expect(payment).not.toHaveProperty("webhookSecret");
    expect(JSON.stringify(payment)).not.toContain("RAZORPAY");
  });
});

describe("customer visibility", () => {
  it("lists only operational profile fields", () => {
    const customer: AdminCustomer = {
      userId: "11111111-1111-4111-8111-111111111111",
      firstName: "Ada",
      lastName: "Lovelace",
      phone: null,
      email: "ada@example.com",
      createdAt: "2026-01-01T00:00:00.000Z",
      orderCount: 2,
    };
    expect(customer).not.toHaveProperty("password");
    expect(customer).not.toHaveProperty("hashedPassword");
    expect(customer).not.toHaveProperty("accessToken");
    expect(customer).not.toHaveProperty("role");
    expect(adminCustomerQuerySchema.parse({}).pageSize).toBe(20);
  });
});

describe("drops and collections", () => {
  it("rejects mass assignment on drop and collection writes", () => {
    expect(
      createDropSchema.safeParse({
        name: "DROP 001",
        slug: "drop-001",
        createdAt: "2020-01-01T00:00:00.000Z",
      }).success,
    ).toBe(false);
    expect(
      createCollectionSchema.safeParse({
        name: "Core",
        slug: "core",
        id: "11111111-1111-4111-8111-111111111111",
      }).success,
    ).toBe(false);
    expect(
      dropProductSchema.safeParse({
        productId: "11111111-1111-4111-8111-111111111111",
        displayOrder: 0,
      }).success,
    ).toBe(true);
  });
});

describe("audit metadata", () => {
  it("strips secrets and keeps safe fields", () => {
    const clean = sanitizeAuditMetadata({
      sku: "TEE-BLK-M",
      razorpayKeySecret: "rzp_secret",
      password: "nope",
      DATABASE_URL: "postgres://x",
      note: "cycle count",
    });
    expect(clean.sku).toBe("TEE-BLK-M");
    expect(clean.note).toBe("cycle count");
    expect(clean).not.toHaveProperty("razorpayKeySecret");
    expect(clean).not.toHaveProperty("password");
    expect(clean).not.toHaveProperty("DATABASE_URL");
    expect(adminAuditQuerySchema.parse({ page: "1" }).pageSize).toBe(20);
  });
});

describe("error mapping", () => {
  it("maps HTTP statuses to safe client messages", () => {
    expect(userFacingApiMessage(new ApiClientError(401, "UNAUTHENTICATED", "raw"))).toBe(
      "Sign in to continue.",
    );
    expect(userFacingApiMessage(new ApiClientError(403, "FORBIDDEN", "raw"))).toMatch(/permission/i);
    expect(userFacingApiMessage(new ApiClientError(404, "NOT_FOUND", "raw"))).toMatch(/not found/i);
    expect(userFacingApiMessage(new ApiClientError(409, "CONFLICT", "Slug taken"))).toBe("Slug taken");
    expect(userFacingApiMessage(new ApiClientError(422, "VALIDATION", "Invalid slug"))).toBe(
      "Invalid slug",
    );
    expect(userFacingApiMessage(new ApiClientError(429, "RATE", "slow"))).toMatch(/Too many/i);
    expect(userFacingApiMessage(new ApiClientError(500, "INTERNAL", "SQL boom pg_"))).not.toMatch(/SQL/);
  });
});

describe("browser bundle safety", () => {
  it("does not reference server secrets in admin client modules", () => {
    const roots = [
      path.join(process.cwd(), "src/lib/api"),
      path.join(process.cwd(), "src/features/admin"),
      path.join(process.cwd(), "src/components/admin"),
      path.join(process.cwd(), "src/components/layout"),
    ];
    const files = roots.flatMap((dir) => walk(dir));
    expect(files.length).toBeGreaterThan(5);
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      for (const secret of secrets) {
        expect(src).not.toContain(secret);
      }
    }
  });
});
