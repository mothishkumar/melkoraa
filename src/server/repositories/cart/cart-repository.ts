import { and, eq, sql } from "drizzle-orm";

import {
  cartItems,
  carts,
  inventory,
  products,
  productVariants,
} from "@/db/schema";
import { MAX_CART_ITEM_QUANTITY } from "@/lib/cart/rules";
import { cartDb, type CartDb } from "@/server/repositories/cart/db";

export async function findActiveCartByUserId(userId: string, db?: CartDb) {
  const client = cartDb(db);
  const [row] = await client
    .select()
    .from(carts)
    .where(and(eq(carts.userId, userId), eq(carts.status, "active")))
    .limit(1);
  return row ?? null;
}

export async function insertActiveCart(userId: string, db?: CartDb) {
  const client = cartDb(db);
  const [row] = await client
    .insert(carts)
    .values({ userId, status: "active" })
    .onConflictDoNothing()
    .returning();
  return row ?? null;
}

export async function getOrCreateActiveCart(userId: string, db?: CartDb) {
  const existing = await findActiveCartByUserId(userId, db);
  if (existing) return existing;

  const created = await insertActiveCart(userId, db);
  if (created) return created;

  const raced = await findActiveCartByUserId(userId, db);
  if (!raced) {
    throw new Error("Unable to create cart");
  }
  return raced;
}

export async function findPurchasableVariant(variantId: string, db?: CartDb) {
  const client = cartDb(db);
  const [row] = await client
    .select({
      variantId: productVariants.id,
      productId: products.id,
      productName: products.name,
      productSlug: products.slug,
      productStatus: products.status,
      sku: productVariants.sku,
      size: productVariants.size,
      color: productVariants.color,
      price: productVariants.price,
      isActive: productVariants.isActive,
      availableUnits: sql<number>`coalesce(${inventory.quantityOnHand} - ${inventory.quantityReserved}, 0)`,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(eq(productVariants.id, variantId))
    .limit(1);
  return row ?? null;
}

export async function listCartLines(userId: string, db?: CartDb) {
  const client = cartDb(db);
  return client
    .select({
      cartId: carts.id,
      variantId: cartItems.variantId,
      quantity: cartItems.quantity,
      storedUnitPrice: cartItems.unitPrice,
      productId: products.id,
      productName: products.name,
      productSlug: products.slug,
      sku: productVariants.sku,
      size: productVariants.size,
      color: productVariants.color,
      livePrice: productVariants.price,
      productStatus: products.status,
      variantActive: productVariants.isActive,
      availableUnits: sql<number>`coalesce(${inventory.quantityOnHand} - ${inventory.quantityReserved}, 0)`,
    })
    .from(carts)
    .innerJoin(cartItems, eq(cartItems.cartId, carts.id))
    .innerJoin(productVariants, eq(productVariants.id, cartItems.variantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(and(eq(carts.userId, userId), eq(carts.status, "active")))
    .orderBy(cartItems.createdAt);
}

export async function findCartItemForUser(
  userId: string,
  variantId: string,
  db?: CartDb,
) {
  const client = cartDb(db);
  const [row] = await client
    .select({
      id: cartItems.id,
      cartId: cartItems.cartId,
      variantId: cartItems.variantId,
      quantity: cartItems.quantity,
      unitPrice: cartItems.unitPrice,
    })
    .from(cartItems)
    .innerJoin(carts, eq(carts.id, cartItems.cartId))
    .where(
      and(
        eq(carts.userId, userId),
        eq(carts.status, "active"),
        eq(cartItems.variantId, variantId),
      ),
    )
    .limit(1);
  return row ?? null;
}

/**
 * Insert or increment quantity for one variant. Unique (cart_id, variant_id)
 * serializes concurrent adds. Returns null when the next qty would exceed the cap.
 */
export async function upsertCartItemQuantity(
  cartId: string,
  variantId: string,
  quantity: number,
  unitPrice: string,
  db?: CartDb,
) {
  const client = cartDb(db);
  const [row] = await client
    .insert(cartItems)
    .values({
      cartId,
      variantId,
      quantity,
      unitPrice,
    })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.variantId],
      set: {
        quantity: sql`${cartItems.quantity} + ${quantity}`,
        unitPrice,
        updatedAt: new Date(),
      },
      setWhere: sql`${cartItems.quantity} + ${quantity} <= ${MAX_CART_ITEM_QUANTITY}`,
    })
    .returning();
  return row ?? null;
}

export async function replaceCartItemQuantity(
  userId: string,
  variantId: string,
  quantity: number,
  unitPrice: string,
  db?: CartDb,
) {
  const existing = await findCartItemForUser(userId, variantId, db);
  if (!existing) return null;
  const client = cartDb(db);
  const [row] = await client
    .update(cartItems)
    .set({
      quantity,
      unitPrice,
      updatedAt: new Date(),
    })
    .where(eq(cartItems.id, existing.id))
    .returning();
  return row ?? null;
}

export async function deleteCartItemForUser(
  userId: string,
  variantId: string,
  db?: CartDb,
) {
  const existing = await findCartItemForUser(userId, variantId, db);
  if (!existing) return false;
  const client = cartDb(db);
  await client.delete(cartItems).where(eq(cartItems.id, existing.id));
  return true;
}

export async function clearCartItemsForUser(userId: string, db?: CartDb) {
  const cart = await findActiveCartByUserId(userId, db);
  if (!cart) return 0;
  const client = cartDb(db);
  const removed = await client
    .delete(cartItems)
    .where(eq(cartItems.cartId, cart.id))
    .returning({ id: cartItems.id });
  return removed.length;
}

export async function convertActiveCart(userId: string, db?: CartDb) {
  const cart = await findActiveCartByUserId(userId, db);
  if (!cart) return null;
  const client = cartDb(db);
  await client.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  const [row] = await client
    .update(carts)
    .set({ status: "converted", updatedAt: new Date() })
    .where(eq(carts.id, cart.id))
    .returning();
  return row ?? null;
}
