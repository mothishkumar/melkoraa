import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { formatInr, formatInrFromMinor } from "@/lib/catalog/money";
import {
  buildCheckoutBody,
  buildVerifyBody,
  isVerifiedPaid,
  paymentHeadline,
  paymentSuccessCopy,
} from "@/features/checkout/contract";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { isProtectedPath } from "@/lib/auth/paths";
import { addCartItemSchema, updateCartItemSchema } from "@/lib/validation/cart";
import { checkoutBodySchema } from "@/lib/validation/checkout";
import { addressBodySchema } from "@/lib/validation/addresses";
import { toggleWishlistItemSchema } from "@/lib/validation/wishlist";
import { AppError } from "@/server/errors";
import { notFoundIfMissing } from "@/lib/storefront/not-found";

describe("storefront money display", () => {
  it("formats catalog prices without float math or hardcoded SKUs", () => {
    expect(formatInr("1499.00")).toContain("1,499");
    expect(formatInrFromMinor(299900)).toContain("2,999");
  });
});

describe("checkout client contract", () => {
  it("sends only addressId and idempotencyKey", () => {
    const key = crypto.randomUUID();
    const body = buildCheckoutBody("11111111-1111-4111-8111-111111111111", key);
    expect(body).toEqual({
      addressId: "11111111-1111-4111-8111-111111111111",
      idempotencyKey: key,
    });
    expect(checkoutBodySchema.safeParse({ ...body, total: 1, userId: "x" }).success).toBe(false);
    expect(checkoutBodySchema.safeParse(body).success).toBe(true);
  });

  it("maps Razorpay callback fields without trusting amount", () => {
    const body = buildVerifyBody({
      razorpay_payment_id: "pay_1",
      razorpay_order_id: "order_1",
      razorpay_signature: "sig",
    });
    expect(body).toEqual({
      razorpayPaymentId: "pay_1",
      razorpayOrderId: "order_1",
      razorpaySignature: "sig",
    });
    expect("amount" in body).toBe(false);
  });

  it("does not claim success until payment is paid", () => {
    expect(isVerifiedPaid("pending")).toBe(false);
    expect(isVerifiedPaid("paid")).toBe(true);
    expect(paymentHeadline("pending", "pending")).toBe("PAYMENT PROCESSING");
    expect(paymentHeadline("pending", "confirmed")).toBe("PAYMENT PROCESSING");
    expect(paymentHeadline("paid", "confirmed")).toBe("ORDER CONFIRMED");
    expect(paymentSuccessCopy("pending")).toContain("not a successful order");
    expect(paymentSuccessCopy("failed")).toContain("did not complete");
  });
});

describe("auth redirects", () => {
  it("sends unauthenticated users to a safe checkout return URL", () => {
    expect(isProtectedPath("/checkout")).toBe(true);
    expect(isProtectedPath("/account")).toBe(true);
    expect(isProtectedPath("/wishlist")).toBe(true);
    expect(getSafeRedirectPath("/checkout")).toBe("/checkout");
    expect(getSafeRedirectPath("https://evil.test", "/checkout")).toBe("/checkout");
    expect(getSafeRedirectPath("//evil.test", "/account")).toBe("/account");
  });
});

describe("cart add payload", () => {
  it("rejects client prices and only accepts variantId + quantity", () => {
    expect(
      addCartItemSchema.safeParse({
        variantId: "11111111-1111-4111-8111-111111111111",
        quantity: 1,
        unitPrice: "1.00",
      }).success,
    ).toBe(false);
    expect(
      addCartItemSchema.safeParse({
        variantId: "11111111-1111-4111-8111-111111111111",
        quantity: 2,
      }).success,
    ).toBe(true);
    expect(updateCartItemSchema.safeParse({ quantity: 3, unitPrice: "9" }).success).toBe(false);
    expect(updateCartItemSchema.safeParse({ quantity: 3 }).success).toBe(true);
  });
});

describe("wishlist", () => {
  it("toggle and remove are product-id only", () => {
    const productId = "11111111-1111-4111-8111-111111111111";
    expect(toggleWishlistItemSchema.safeParse({ productId }).success).toBe(true);
    expect(toggleWishlistItemSchema.safeParse({ productId, userId: productId }).success).toBe(
      false,
    );
  });
});

describe("order ownership", () => {
  it("maps missing orders to not found rather than leaking ownership", () => {
    expect(() => notFoundIfMissing(new AppError("NOT_FOUND", "Missing", 404))).toThrow();
    expect(() => notFoundIfMissing(new AppError("FORBIDDEN", "No", 403))).toThrow(/No/);
  });
});

describe("addresses", () => {
  it("rejects client userId on address create", () => {
    expect(
      addressBodySchema.safeParse({
        name: "Builder",
        addressLine1: "1 Street",
        city: "Chennai",
        state: "TN",
        postalCode: "600001",
        country: "IN",
        userId: "11111111-1111-4111-8111-111111111111",
      }).success,
    ).toBe(false);
  });
});

describe("collection add to bag", () => {
  it("adds from the card without linking Add to bag to the PDP", () => {
    const src = readFileSync(
      path.join(process.cwd(), "src/components/product/product-card.tsx"),
      "utf8",
    );
    expect(src).toContain("AddToBagButton");
    expect(src).not.toMatch(/href=\{`\/products\/\$\{product\.slug\}`\}[\s\S]*Add to bag/);
  });
});

describe("checkout empty bag sync", () => {
  it("revalidates the bag against GET /api/v1/cart before paying", () => {
    const src = readFileSync(
      path.join(process.cwd(), "src/features/checkout/checkout-client.tsx"),
      "utf8",
    );
    expect(src).toContain("getCartRequest");
    expect(src).toContain("authoritative.items.length === 0");
  });
});

describe("browser bundle safety", () => {
  it("does not reference server secrets in storefront client modules", () => {
    const files = [
      "src/features/checkout/checkout-client.tsx",
      "src/lib/api/client.ts",
      "src/lib/api/checkout.ts",
      "src/components/product/product-purchase.tsx",
      "src/components/product/add-to-bag-button.tsx",
      "src/components/layout/bag-link.tsx",
    ];
    for (const file of files) {
      const src = readFileSync(path.join(process.cwd(), file), "utf8");
      expect(src).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
      expect(src).not.toContain("RAZORPAY_KEY_SECRET");
      expect(src).not.toContain("DATABASE_URL");
      expect(src).not.toContain("DIRECT_DATABASE_URL");
    }
  });
});
