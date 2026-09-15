import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { moneyToMinor } from "@/lib/catalog/money";
import { verifyPaymentBodySchema } from "@/lib/validation/payments";
import { checkoutBodySchema } from "@/lib/validation/checkout";

describe("payment amounts", () => {
  it("converts authoritative INR amounts to integer paise", () => {
    expect(moneyToMinor("1499.00")).toBe(149900);
    expect(moneyToMinor("100.00")).toBe(10000);
  });
});

describe("payment verification validation", () => {
  it("rejects client-controlled amount, status, and userId", () => {
    expect(
      verifyPaymentBodySchema.safeParse({
        razorpayPaymentId: "pay_1",
        razorpayOrderId: "order_1",
        razorpaySignature: "sig",
        amount: 1,
        userId: "11111111-1111-4111-8111-111111111111",
        paymentStatus: "paid",
      }).success,
    ).toBe(false);
  });

  it("does not accept checkout totals from the client", () => {
    expect(
      checkoutBodySchema.safeParse({
        addressId: "11111111-1111-4111-8111-111111111111",
        idempotencyKey: "22222222-2222-4222-8222-222222222222",
        amount: 149900,
        currency: "INR",
      }).success,
    ).toBe(false);
  });
});

describe("checkout payment boundary", () => {
  it("does not create Razorpay orders inside the checkout database transaction", () => {
    const src = readFileSync(
      path.join(process.cwd(), "src/server/services/checkout/checkout-service.ts"),
      "utf8",
    );
    const transactionBlock = src.slice(
      src.indexOf("async function createCheckoutOrder"),
      src.indexOf("export async function checkout"),
    );
    expect(transactionBlock).toContain("reserveInventory");
    expect(transactionBlock).not.toContain("createOrder");
    expect(transactionBlock).not.toContain("getPaymentProvider");
    expect(transactionBlock).not.toContain("confirmInventorySale");
    expect(src).toContain("attachRazorpayOrderForCheckout");
  });

  it("does not expose Razorpay secrets in checkout or payment services", () => {
    const checkout = readFileSync(
      path.join(process.cwd(), "src/server/services/checkout/checkout-service.ts"),
      "utf8",
    );
    const payments = readFileSync(
      path.join(process.cwd(), "src/server/services/payments/payment-service.ts"),
      "utf8",
    );
    expect(checkout).not.toContain("RAZORPAY_KEY_SECRET");
    expect(payments).not.toContain("NEXT_PUBLIC_RAZORPAY");
    expect(payments).toContain("getRazorpayPublicKeyId");
  });
});
