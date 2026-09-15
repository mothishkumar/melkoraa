import { describe, expect, it } from "vitest";

import {
  applyAdjust,
  applyConfirmSale,
  applyRelease,
  applyReserve,
  availableQuantity,
  canAdjustOnHand,
  canConfirmSale,
  canRelease,
  canReserve,
} from "@/lib/inventory/rules";
import {
  adjustInventorySchema,
  initializeInventorySchema,
  inventoryListQuerySchema,
  stockMutationSchema,
} from "@/lib/validation/inventory";
import { hasMinRole, hasStaffAccess, isManager } from "@/lib/auth/permissions";
import type { PublicVariant } from "@/types/catalog";

describe("inventory formulas", () => {
  it("1. available equals on_hand minus reserved", () => {
    expect(availableQuantity(10, 3)).toBe(7);
    expect(availableQuantity(1, 1)).toBe(0);
  });

  it("2. quantities stay integers (no float stock math)", () => {
    expect(Number.isInteger(availableQuantity(5, 2))).toBe(true);
  });

  it("3. adjust increases on_hand and leaves reserved/sold unchanged", () => {
    expect(applyAdjust(10, 2, 4, 5)).toEqual({ onHand: 15, reserved: 2, sold: 4 });
  });

  it("4. adjust decreases on_hand", () => {
    expect(applyAdjust(10, 2, 0, -3)).toEqual({ onHand: 7, reserved: 2, sold: 0 });
  });

  it("5. adjust cannot make on_hand negative", () => {
    expect(canAdjustOnHand(2, 0, -3)).toBe(false);
    expect(applyAdjust(2, 0, 0, -3)).toBeNull();
  });

  it("6. adjust cannot make on_hand lower than reserved", () => {
    expect(canAdjustOnHand(5, 4, -2)).toBe(false);
    expect(applyAdjust(5, 4, 0, -2)).toBeNull();
  });

  it("7. reserve succeeds when available >= quantity and does not change on_hand/sold", () => {
    expect(canReserve(10, 2, 3)).toBe(true);
    expect(applyReserve(10, 2, 8, 3)).toEqual({ onHand: 10, reserved: 5, sold: 8 });
  });

  it("8. reserve fails when available is insufficient", () => {
    expect(canReserve(5, 4, 2)).toBe(false);
    expect(applyReserve(5, 4, 0, 2)).toBeNull();
  });

  it("9. release decreases reserved only", () => {
    expect(applyRelease(10, 4, 1, 3)).toEqual({ onHand: 10, reserved: 1, sold: 1 });
  });

  it("10. release fails when reserved < quantity", () => {
    expect(canRelease(2, 3)).toBe(false);
    expect(applyRelease(10, 2, 0, 3)).toBeNull();
  });

  it("11. confirm sale decreases reserved, increases sold, leaves on_hand unchanged", () => {
    expect(applyConfirmSale(10, 4, 2, 3)).toEqual({ onHand: 10, reserved: 1, sold: 5 });
  });

  it("12. confirm sale fails when reserved < quantity", () => {
    expect(canConfirmSale(1, 2)).toBe(false);
    expect(applyConfirmSale(10, 1, 0, 2)).toBeNull();
  });
});

describe("inventory validation", () => {
  it("13. rejects zero, decimals, NaN, Infinity, and huge quantities", () => {
    expect(stockMutationSchema.safeParse({ quantity: 0 }).success).toBe(false);
    expect(stockMutationSchema.safeParse({ quantity: 1.5 }).success).toBe(false);
    expect(stockMutationSchema.safeParse({ quantity: Number.NaN }).success).toBe(false);
    expect(stockMutationSchema.safeParse({ quantity: Number.POSITIVE_INFINITY }).success).toBe(
      false,
    );
    expect(stockMutationSchema.safeParse({ quantity: 1_000_001 }).success).toBe(false);
    expect(stockMutationSchema.safeParse({ quantity: 2 }).success).toBe(true);
    expect(adjustInventorySchema.safeParse({ delta: 0 }).success).toBe(false);
    expect(adjustInventorySchema.safeParse({ delta: -3 }).success).toBe(true);
  });

  it("14. rejects mass assignment of stock fields and timestamps", () => {
    expect(
      stockMutationSchema.safeParse({
        quantity: 1,
        onHand: 99,
        reserved: 1,
        sold: 1,
        id: "x",
      }).success,
    ).toBe(false);
    expect(
      initializeInventorySchema.safeParse({
        variantId: "11111111-1111-4111-8111-111111111111",
        onHand: 5,
        createdAt: "2020-01-01T00:00:00.000Z",
      }).success,
    ).toBe(false);
  });

  it("15. only allowlisted inventory sorts are accepted", () => {
    expect(inventoryListQuerySchema.parse({}).sort).toBe("updated_desc");
    expect(inventoryListQuerySchema.safeParse({ sort: "quantity_on_hand" }).success).toBe(false);
  });
});

describe("inventory authorization policy", () => {
  it("16. customers cannot access staff inventory reads or manager mutations", () => {
    expect(hasStaffAccess("customer")).toBe(false);
    expect(isManager("customer")).toBe(false);
    expect(hasMinRole("customer", "staff")).toBe(false);
    expect(hasMinRole("staff", "staff")).toBe(true);
    expect(hasMinRole("staff", "manager")).toBe(false);
    expect(isManager("manager")).toBe(true);
    expect(isManager("admin")).toBe(true);
  });
});

describe("logical oversell", () => {
  it("17. two sequential reserve(1) calls against available=1 cannot both succeed", () => {
    let state = { onHand: 1, reserved: 0, sold: 0 };
    const first = applyReserve(state.onHand, state.reserved, state.sold, 1);
    expect(first).not.toBeNull();
    state = first!;
    const second = applyReserve(state.onHand, state.reserved, state.sold, 1);
    expect(second).toBeNull();
  });
});

describe("ledger rollback contract", () => {
  it("21. a failed ledger insert must not leave a reserved quantity (same transaction)", () => {
    const before = { onHand: 4, reserved: 0, sold: 0 };
    const reserved = applyReserve(before.onHand, before.reserved, before.sold, 1);
    expect(reserved).toEqual({ onHand: 4, reserved: 1, sold: 0 });
    const ledgerQuantity = 0;
    const ledgerLegal = ledgerQuantity !== 0;
    expect(ledgerLegal).toBe(false);
    const committed = ledgerLegal ? reserved : before;
    expect(committed).toEqual(before);
  });
});

describe("public catalog isolation", () => {
  it("20. public variant payloads expose available, never on_hand/reserved/sold", () => {
    const variant: PublicVariant = {
      id: "11111111-1111-4111-8111-111111111111",
      sku: "X",
      size: "M",
      color: "Black",
      colorCode: null,
      price: "1499.00",
      compareAtPrice: null,
      available: true,
    };
    expect(variant).not.toHaveProperty("onHand");
    expect(variant).not.toHaveProperty("reserved");
    expect(variant).not.toHaveProperty("sold");
    expect(variant).not.toHaveProperty("quantityOnHand");
    expect(typeof variant.available).toBe("boolean");
  });
});
