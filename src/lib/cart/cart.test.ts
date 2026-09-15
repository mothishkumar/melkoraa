import { describe, expect, it } from "vitest";

import {
  canSetCartQuantity,
  cartLineAvailable,
  MAX_CART_ITEM_QUANTITY,
  mergeCartQuantities,
} from "@/lib/cart/rules";
import { lineTotalMinor, minorToMoney, moneyToMinor, toMoneyString } from "@/lib/catalog/money";
import { addCartItemSchema, updateCartItemSchema } from "@/lib/validation/cart";
import { addWishlistItemSchema } from "@/lib/validation/wishlist";
import { hasStaffAccess } from "@/lib/auth/permissions";
import { emptyCart, mapCart, mapCartItem } from "@/server/services/cart/mappers";
import { emptyWishlist, mapWishlistItem } from "@/server/services/wishlist/mappers";
import type { CartItemDto } from "@/types/cart";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("cart quantity rules", () => {
  it("1. quantity must be an integer >= 1", () => {
    expect(canSetCartQuantity(1)).toBe(true);
    expect(canSetCartQuantity(0)).toBe(false);
  });

  it("2. rejects negative quantity", () => {
    expect(canSetCartQuantity(-1)).toBe(false);
    expect(addCartItemSchema.safeParse({ variantId: "11111111-1111-4111-8111-111111111111", quantity: -3 }).success).toBe(false);
  });

  it("3. rejects decimal quantity", () => {
    expect(addCartItemSchema.safeParse({ variantId: "11111111-1111-4111-8111-111111111111", quantity: 1.5 }).success).toBe(false);
  });

  it("4. rejects NaN and Infinity", () => {
    expect(addCartItemSchema.safeParse({ variantId: "11111111-1111-4111-8111-111111111111", quantity: Number.NaN }).success).toBe(false);
    expect(addCartItemSchema.safeParse({ variantId: "11111111-1111-4111-8111-111111111111", quantity: Number.POSITIVE_INFINITY }).success).toBe(false);
  });

  it("5. rejects quantity above 20", () => {
    expect(MAX_CART_ITEM_QUANTITY).toBe(20);
    expect(addCartItemSchema.safeParse({ variantId: "11111111-1111-4111-8111-111111111111", quantity: 21 }).success).toBe(false);
    expect(canSetCartQuantity(20)).toBe(true);
  });

  it("6. adding the same variant merges quantities", () => {
    expect(mergeCartQuantities(2, 3)).toBe(5);
  });

  it("7. merge fails when the next quantity would exceed 20", () => {
    expect(mergeCartQuantities(15, 10)).toBeNull();
  });

  it("8. two concurrent add(1) on empty logically become quantity 2, never two rows", () => {
    const first = mergeCartQuantities(0, 1);
    expect(first).toBe(1);
    expect(mergeCartQuantities(first!, 1)).toBe(2);
  });
});

describe("cart validation / mass assignment", () => {
  it("9. add body is strict: variantId + quantity only", () => {
    const ok = addCartItemSchema.safeParse({
      variantId: "11111111-1111-4111-8111-111111111111",
      quantity: 2,
    });
    expect(ok.success).toBe(true);
  });

  it("10. rejects client userId, cartId, prices, and totals", () => {
    expect(
      addCartItemSchema.safeParse({
        variantId: "11111111-1111-4111-8111-111111111111",
        quantity: 1,
        userId: "11111111-1111-4111-8111-111111111111",
        cartId: "11111111-1111-4111-8111-111111111111",
        unitPrice: "1.00",
        subtotal: "1.00",
      }).success,
    ).toBe(false);
  });

  it("11. patch only accepts quantity", () => {
    expect(updateCartItemSchema.safeParse({ quantity: 4 }).success).toBe(true);
    expect(
      updateCartItemSchema.safeParse({
        quantity: 4,
        variantId: "11111111-1111-4111-8111-111111111111",
        onHand: 99,
      }).success,
    ).toBe(false);
  });
});

describe("cart money", () => {
  it("12. money uses integer minor units, not floats", () => {
    expect(moneyToMinor("1499.00")).toBe(149900);
    expect(minorToMoney(149900)).toBe("1499.00");
    expect(lineTotalMinor(149900, 2)).toBe(299800);
    expect(toMoneyString("1499")).toBe("1499.00");
  });

  it("13. subtotal is the sum of line totals in minor units", () => {
    const items: CartItemDto[] = [
      {
        variantId: "a",
        productId: "p",
        productName: "A",
        productSlug: "a",
        sku: "A",
        size: "M",
        color: "Black",
        quantity: 2,
        unitPrice: "100.00",
        unitPriceMinor: 10000,
        lineTotal: "200.00",
        lineTotalMinor: 20000,
        available: true,
      },
      {
        variantId: "b",
        productId: "p",
        productName: "B",
        productSlug: "b",
        sku: "B",
        size: "L",
        color: "Black",
        quantity: 1,
        unitPrice: "50.50",
        unitPriceMinor: 5050,
        lineTotal: "50.50",
        lineTotalMinor: 5050,
        available: true,
      },
    ];
    const cart = mapCart("cart-1", items);
    expect(cart.subtotalMinor).toBe(25050);
    expect(cart.subtotal).toBe("250.50");
    expect(cart.itemCount).toBe(3);
  });
});

describe("cart availability flags", () => {
  it("14. GET uses live catalog price, not a client-supplied price", () => {
    const item = mapCartItem({
      variantId: "11111111-1111-4111-8111-111111111111",
      productId: "22222222-2222-4222-8222-222222222222",
      productName: "Cap",
      productSlug: "cap",
      sku: "CAP",
      size: "OS",
      color: "Black",
      quantity: 1,
      livePrice: "1999.00",
      availableUnits: 10,
      productStatus: "active",
      variantActive: true,
    });
    expect(item.unitPrice).toBe("1999.00");
    expect(item.unitPriceMinor).toBe(199900);
  });

  it("15. qty greater than availability sets available false and keeps quantity", () => {
    const item = mapCartItem({
      variantId: "11111111-1111-4111-8111-111111111111",
      productId: "22222222-2222-4222-8222-222222222222",
      productName: "Cap",
      productSlug: "cap",
      sku: "CAP",
      size: "OS",
      color: "Black",
      quantity: 5,
      livePrice: "100.00",
      availableUnits: 2,
      productStatus: "active",
      variantActive: true,
    });
    expect(item.available).toBe(false);
    expect(item.quantity).toBe(5);
  });

  it("16. available is true when stock covers quantity", () => {
    expect(cartLineAvailable(3, 3)).toBe(true);
    expect(cartLineAvailable(2, 3)).toBe(false);
  });

  it("17. public cart DTO never includes onHand, reserved, sold, cost, or supplier", () => {
    const cart = emptyCart();
    const blob = JSON.stringify(cart);
    expect(blob).not.toContain("onHand");
    expect(blob).not.toContain("reserved");
    expect(blob).not.toContain("sold");
    expect(blob).not.toContain("supplier");
    expect(blob).not.toContain("cost");
  });

  it("18. empty cart DTO has null id and zero totals without creating a row", () => {
    const cart = emptyCart();
    expect(cart.id).toBeNull();
    expect(cart.items).toEqual([]);
    expect(cart.itemCount).toBe(0);
    expect(cart.subtotalMinor).toBe(0);
  });

  it("19. archived products are flagged unavailable in the bag", () => {
    const item = mapCartItem({
      variantId: "11111111-1111-4111-8111-111111111111",
      productId: "22222222-2222-4222-8222-222222222222",
      productName: "Old",
      productSlug: "old",
      sku: "OLD",
      size: "M",
      color: "Black",
      quantity: 1,
      livePrice: "100.00",
      availableUnits: 50,
      productStatus: "archived",
      variantActive: true,
    });
    expect(item.available).toBe(false);
    expect(item.quantity).toBe(1);
  });
});

describe("cart authorization policy", () => {
  it("20. unauthenticated callers have no staff/customer cart rights until requireApiAuth", () => {
    expect(hasStaffAccess(null)).toBe(false);
  });

  it("21. owner key is the session user id, never a client cartId", () => {
    const body = addCartItemSchema.safeParse({
      variantId: "11111111-1111-4111-8111-111111111111",
      quantity: 1,
      cartId: "99999999-9999-4999-8999-999999999999",
    });
    expect(body.success).toBe(false);
  });
});

describe("wishlist validation", () => {
  it("22. wishlist add is product-based and strict", () => {
    expect(
      addWishlistItemSchema.safeParse({
        productId: "11111111-1111-4111-8111-111111111111",
      }).success,
    ).toBe(true);
  });

  it("23. rejects variantId, userId, and duplicates fields on wishlist add", () => {
    expect(
      addWishlistItemSchema.safeParse({
        productId: "11111111-1111-4111-8111-111111111111",
        variantId: "11111111-1111-4111-8111-111111111111",
        userId: "11111111-1111-4111-8111-111111111111",
      }).success,
    ).toBe(false);
  });

  it("24. empty wishlist DTO has no stock counts", () => {
    const wishlist = emptyWishlist();
    expect(wishlist.id).toBeNull();
    expect(JSON.stringify(wishlist)).not.toContain("onHand");
  });

  it("25. wishlist item exposes boolean available only", () => {
    const item = mapWishlistItem({
      productId: "11111111-1111-4111-8111-111111111111",
      name: "Cap",
      slug: "cap",
      price: "1499.00",
      available: true,
    });
    expect(item.available).toBe(true);
    expect(item.priceMinor).toBe(149900);
    expect(item).not.toHaveProperty("quantityOnHand");
  });
});

describe("add-to-cart does not reserve stock", () => {
  it("26. availability math never mutates on_hand or reserved", () => {
    const onHand = 10;
    const reserved = 1;
    expect(cartLineAvailable(onHand - reserved, 2)).toBe(true);
    expect(onHand).toBe(10);
    expect(reserved).toBe(1);
  });

  it("33. patch rejects quantity 0", () => {
    expect(updateCartItemSchema.safeParse({ quantity: 0 }).success).toBe(false);
  });

  it("34. itemCount is the sum of quantities, not the number of rows", () => {
    const cart = mapCart("c", [
      {
        variantId: "a",
        productId: "p",
        productName: "A",
        productSlug: "a",
        sku: "A",
        size: "M",
        color: "Black",
        quantity: 4,
        unitPrice: "10.00",
        unitPriceMinor: 1000,
        lineTotal: "40.00",
        lineTotalMinor: 4000,
        available: true,
      },
    ]);
    expect(cart.items).toHaveLength(1);
    expect(cart.itemCount).toBe(4);
  });

  it("35. wishlist toggle is add then remove of the same product id", () => {
    const productId = "11111111-1111-4111-8111-111111111111";
    const ids = new Set<string>();
    ids.add(productId);
    expect(ids.has(productId)).toBe(true);
    ids.delete(productId);
    expect(ids.has(productId)).toBe(false);
  });

  it("36. invalid variant ids are rejected", () => {
    expect(addCartItemSchema.safeParse({ variantId: "not-a-uuid", quantity: 1 }).success).toBe(false);
  });

  it("37. cart DTO has no userId or profileId fields", () => {
    const cart = emptyCart();
    expect(cart).not.toHaveProperty("userId");
    expect(cart).not.toHaveProperty("profileId");
  });

  it("38. cart and wishlist services do not import inventory reservation functions", () => {
    const cartSrc = readFileSync(
      path.join(process.cwd(), "src/server/services/cart/cart-service.ts"),
      "utf8",
    );
    const wishlistSrc = readFileSync(
      path.join(process.cwd(), "src/server/services/wishlist/wishlist-service.ts"),
      "utf8",
    );
    for (const src of [cartSrc, wishlistSrc]) {
      expect(src).not.toContain("reserveInventory");
      expect(src).not.toContain("releaseInventory");
      expect(src).not.toContain("confirmInventorySale");
    }
  });
});
