import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { AUTH_MESSAGES, mapAuthError } from "@/lib/auth/errors";
import { isProtectedPath } from "@/lib/auth/paths";
import {
  defaultPostLoginPath,
  hasMinRole,
  hasStaffAccess,
  isAdmin,
  isManager,
  resolvePostLoginPath,
} from "@/lib/auth/permissions";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { getSiteUrl } from "@/lib/auth/site-url";
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/auth/schemas";

describe("getSafeRedirectPath", () => {
  it("allows internal relative paths", () => {
    expect(getSafeRedirectPath("/account")).toBe("/account");
    expect(getSafeRedirectPath("/account/orders?tab=open")).toBe(
      "/account/orders?tab=open",
    );
  });

  it("rejects open redirects", () => {
    expect(getSafeRedirectPath("https://evil.example")).toBe("/account");
    expect(getSafeRedirectPath("//evil.example")).toBe("/account");
    expect(getSafeRedirectPath("/\\evil.example")).toBe("/account");
    expect(getSafeRedirectPath("https://evil.example/phish")).toBe("/account");
    expect(getSafeRedirectPath("javascript:alert(1)")).toBe("/account");
    expect(getSafeRedirectPath("")).toBe("/account");
  });

  it("uses a custom fallback", () => {
    expect(getSafeRedirectPath(null, "/login")).toBe("/login");
  });
});

describe("roles", () => {
  it("ranks staff, manager, and admin above customer", () => {
    expect(hasStaffAccess("customer")).toBe(false);
    expect(hasStaffAccess("staff")).toBe(true);
    expect(hasStaffAccess("manager")).toBe(true);
    expect(hasStaffAccess("admin")).toBe(true);
    expect(isManager("staff")).toBe(false);
    expect(isManager("manager")).toBe(true);
    expect(isAdmin("manager")).toBe(false);
    expect(isAdmin("admin")).toBe(true);
    expect(hasMinRole("staff", "staff")).toBe(true);
    expect(hasMinRole("customer", "staff")).toBe(false);
    expect(hasMinRole("admin", "manager")).toBe(true);
  });

  it("sends customers to account and staff to admin", () => {
    expect(defaultPostLoginPath("customer")).toBe("/account");
    expect(defaultPostLoginPath("staff")).toBe("/admin");
    expect(defaultPostLoginPath("manager")).toBe("/admin");
    expect(defaultPostLoginPath("admin")).toBe("/admin");
  });

  it("does not honor admin return URLs for customers", () => {
    expect(
      resolvePostLoginPath("customer", "/admin", getSafeRedirectPath),
    ).toBe("/unauthorized");
    expect(
      resolvePostLoginPath("staff", "/admin/products", getSafeRedirectPath),
    ).toBe("/admin/products");
    expect(
      resolvePostLoginPath("customer", "https://evil.example", getSafeRedirectPath),
    ).toBe("/account");
  });
});

describe("protected paths", () => {
  it("protects account, checkout, and admin prefixes", () => {
    expect(isProtectedPath("/account")).toBe(true);
    expect(isProtectedPath("/account/orders")).toBe(true);
    expect(isProtectedPath("/admin")).toBe(true);
    expect(isProtectedPath("/admin/products")).toBe(true);
    expect(isProtectedPath("/checkout")).toBe(true);
    expect(isProtectedPath("/wishlist")).toBe(true);
    expect(isProtectedPath("/order/abc")).toBe(true);
    expect(isProtectedPath("/shop")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
  });
});

describe("form schemas", () => {
  it("validates registration", () => {
    const ok = registerSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      password: "Builder01",
      confirmPassword: "Builder01",
    });
    expect(ok.success).toBe(true);

    const short = registerSchema.safeParse({
      fullName: "A",
      email: "not-an-email",
      password: "short",
      confirmPassword: "short",
    });
    expect(short.success).toBe(false);
  });

  it("requires matching passwords", () => {
    const mismatch = resetPasswordSchema.safeParse({
      password: "Builder01",
      confirmPassword: "Builder02",
    });
    expect(mismatch.success).toBe(false);

    const match = resetPasswordSchema.safeParse({
      password: "Builder01",
      confirmPassword: "Builder01",
    });
    expect(match.success).toBe(true);
  });

  it("validates login email", () => {
    expect(
      loginSchema.safeParse({ email: "bad", password: "x" }).success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({ email: "ada@example.com", password: "x" }).success,
    ).toBe(true);
  });
});

describe("auth error mapping", () => {
  it("hides credential details", () => {
    expect(mapAuthError({ message: "Invalid login credentials", status: 400 })).toBe(
      AUTH_MESSAGES.invalidLogin,
    );
  });

  it("maps already confirmed email copy", () => {
    expect(mapAuthError({ message: "Email already confirmed" })).toBe(
      AUTH_MESSAGES.alreadyVerified,
    );
  });
});

describe("getSiteUrl", () => {
  const keys = ["NEXT_PUBLIC_SITE_URL", "VERCEL_URL"] as const;
  const previous: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of keys) {
      previous[key] = process.env[key];
    }
  });

  afterEach(() => {
    for (const key of keys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("ignores blank NEXT_PUBLIC_SITE_URL so Vercel builds do not throw Invalid URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "   ";
    process.env.VERCEL_URL = "melkoraa-abc.vercel.app";
    expect(getSiteUrl()).toBe("https://melkoraa-abc.vercel.app");
    expect(() => new URL(getSiteUrl())).not.toThrow();
  });

  it("prefers a configured public site URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://melkoraa.in/";
    process.env.VERCEL_URL = "ignored.vercel.app";
    expect(getSiteUrl()).toBe("https://melkoraa.in");
  });
});

