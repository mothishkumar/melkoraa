import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { generateOrderNumber, isOrderNumber } from "@/lib/orders/order-number";
import { checkoutBodySchema } from "@/lib/validation/checkout";
import { canCancelUnpaid } from "@/server/services/orders/order-service";
import { mapOrderItem } from "@/server/services/orders/mappers";
import { lineTotalMinor, moneyToMinor } from "@/lib/catalog/money";

describe("checkout validation", () => {
  it("rejects client userId, cartId, orderId, prices, totals, and payment status", () => {
    expect(
      checkoutBodySchema.safeParse({
        addressId: "11111111-1111-4111-8111-111111111111",
        idempotencyKey: "22222222-2222-4222-8222-222222222222",
        userId: "11111111-1111-4111-8111-111111111111",
        cartId: "11111111-1111-4111-8111-111111111111",
        totalAmount: "1.00",
        paymentStatus: "paid",
      }).success,
    ).toBe(false);
  });

  it("accepts addressId and idempotencyKey only", () => {
    expect(
      checkoutBodySchema.safeParse({
        addressId: "11111111-1111-4111-8111-111111111111",
        idempotencyKey: "22222222-2222-4222-8222-222222222222",
      }).success,
    ).toBe(true);
  });
});

describe("order numbers and money snapshots", () => {
  it("generates MK-YEAR-XXXXXXXX without Date.now() millis", () => {
    const one = generateOrderNumber(new Date("2026-09-15T00:00:00.000Z"));
    const two = generateOrderNumber(new Date("2026-09-15T00:00:00.000Z"));
    expect(isOrderNumber(one)).toBe(true);
    expect(one.startsWith("MK-2026-")).toBe(true);
    expect(one).not.toBe(two);
    expect(one).not.toMatch(/169/);
  });

  it("snapshots line totals from catalog minor units, not a client price", () => {
    const live = "1499.00";
    const qty = 2;
    const line = lineTotalMinor(moneyToMinor(live), qty);
    expect(line).toBe(299800);
    const item = mapOrderItem({
      id: "11111111-1111-4111-8111-111111111111",
      orderId: "22222222-2222-4222-8222-222222222222",
      productId: "33333333-3333-4333-8333-333333333333",
      variantId: "44444444-4444-4444-8444-444444444444",
      productNameSnapshot: "Cap",
      skuSnapshot: "CAP",
      sizeSnapshot: "OS",
      colorSnapshot: "Black",
      unitPrice: live,
      quantity: qty,
      totalPrice: "2998.00",
      createdAt: new Date(),
    });
    expect(item.unitPriceMinor).toBe(149900);
    expect(item.lineTotalMinor).toBe(299800);
    expect(JSON.stringify(item)).not.toContain("onHand");
  });
});

describe("cancel policy", () => {
  it("allows cancel only for pending unpaid orders", () => {
    expect(canCancelUnpaid("pending", "pending")).toBe(true);
    expect(canCancelUnpaid("pending", "paid")).toBe(false);
    expect(canCancelUnpaid("cancelled", "pending")).toBe(false);
  });
});

describe("phase 8 boundary", () => {
  it("checkout service never confirms a sale or marks paid", () => {
    const src = readFileSync(
      path.join(process.cwd(), "src/server/services/checkout/checkout-service.ts"),
      "utf8",
    );
    expect(src).not.toContain("confirmInventorySale");
    expect(src).not.toContain("paymentStatus: \"paid\"");
    expect(src).toContain("reserveInventory");
  });
});
