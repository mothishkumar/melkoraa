import { getDb } from "@/db";
import { toMoneyString } from "@/lib/catalog/money";
import { logger } from "@/lib/logger";
import { notFoundError, unprocessableError } from "@/server/errors";
import * as cartRepo from "@/server/repositories/cart/cart-repository";
import { emptyCart, mapCart, mapCartItem } from "@/server/services/cart/mappers";
import type { CartDto } from "@/types/cart";

function requirePurchasableVariant(
  variant: Awaited<ReturnType<typeof cartRepo.findPurchasableVariant>>,
) {
  if (!variant || variant.productStatus !== "active" || variant.isActive !== true) {
    throw notFoundError("VARIANT_UNAVAILABLE", "This variant is not available.");
  }
  return variant;
}

async function loadCartDto(userId: string): Promise<CartDto> {
  const cart = await cartRepo.findActiveCartByUserId(userId);
  if (!cart) return emptyCart();
  const lines = await cartRepo.listCartLines(userId);
  return mapCart(cart.id, lines.map(mapCartItem));
}

export async function getCart(userId: string): Promise<CartDto> {
  return loadCartDto(userId);
}

export async function addCartItem(
  userId: string,
  variantId: string,
  quantity: number,
): Promise<CartDto> {
  const variant = requirePurchasableVariant(
    await cartRepo.findPurchasableVariant(variantId),
  );
  const unitPrice = toMoneyString(variant.price);
  const db = getDb();

  const upserted = await db.transaction(async (tx) => {
    const cart = await cartRepo.getOrCreateActiveCart(userId, tx);
    return cartRepo.upsertCartItemQuantity(
      cart.id,
      variantId,
      quantity,
      unitPrice,
      tx,
    );
  });

  if (!upserted) {
    throw unprocessableError(
      "CART_QUANTITY_LIMIT",
      "You already have the maximum quantity of this variant in your bag.",
    );
  }

  logger.info("cart.item_added", { resourceId: variantId });
  return loadCartDto(userId);
}

export async function updateCartItem(
  userId: string,
  variantId: string,
  quantity: number,
): Promise<CartDto> {
  const variant = requirePurchasableVariant(
    await cartRepo.findPurchasableVariant(variantId),
  );
  const unitPrice = toMoneyString(variant.price);
  const updated = await cartRepo.replaceCartItemQuantity(
    userId,
    variantId,
    quantity,
    unitPrice,
  );
  if (!updated) {
    throw notFoundError("CART_ITEM_NOT_FOUND", "That item is not in your bag.");
  }
  logger.info("cart.item_updated", { resourceId: variantId });
  return loadCartDto(userId);
}

export async function removeCartItem(userId: string, variantId: string): Promise<CartDto> {
  const removed = await cartRepo.deleteCartItemForUser(userId, variantId);
  if (!removed) {
    throw notFoundError("CART_ITEM_NOT_FOUND", "That item is not in your bag.");
  }
  logger.info("cart.item_removed", { resourceId: variantId });
  return loadCartDto(userId);
}

export async function clearCart(userId: string): Promise<CartDto> {
  await cartRepo.clearCartItemsForUser(userId);
  logger.info("cart.cleared");
  return loadCartDto(userId);
}
