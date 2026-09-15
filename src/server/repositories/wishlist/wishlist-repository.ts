import { and, desc, eq, sql } from "drizzle-orm";

import { inventory, products, productVariants, wishlistItems, wishlists } from "@/db/schema";
import { cartDb, type CartDb } from "@/server/repositories/cart/db";

export async function findWishlistByUserId(userId: string, db?: CartDb) {
  const client = cartDb(db);
  const [row] = await client
    .select()
    .from(wishlists)
    .where(eq(wishlists.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function insertWishlist(userId: string, db?: CartDb) {
  const client = cartDb(db);
  const [row] = await client
    .insert(wishlists)
    .values({ userId })
    .onConflictDoNothing()
    .returning();
  return row ?? null;
}

export async function getOrCreateWishlist(userId: string, db?: CartDb) {
  const existing = await findWishlistByUserId(userId, db);
  if (existing) return existing;
  const created = await insertWishlist(userId, db);
  if (created) return created;
  const raced = await findWishlistByUserId(userId, db);
  if (!raced) {
    throw new Error("Unable to create wishlist");
  }
  return raced;
}

export async function findPublicProduct(productId: string, db?: CartDb) {
  const client = cartDb(db);
  const [row] = await client
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      status: products.status,
      basePrice: products.basePrice,
      available: sql<boolean>`coalesce(bool_or(${productVariants.isActive} and (${inventory.quantityOnHand} - ${inventory.quantityReserved}) > 0), false)`,
    })
    .from(products)
    .leftJoin(productVariants, eq(productVariants.productId, products.id))
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(eq(products.id, productId))
    .groupBy(products.id)
    .limit(1);
  return row ?? null;
}

export async function listWishlistLines(userId: string, db?: CartDb) {
  const client = cartDb(db);
  return client
    .select({
      wishlistId: wishlists.id,
      productId: products.id,
      name: products.name,
      slug: products.slug,
      price: products.basePrice,
      available: sql<boolean>`coalesce(bool_or(${productVariants.isActive} and (${inventory.quantityOnHand} - ${inventory.quantityReserved}) > 0), false)`,
      addedAt: wishlistItems.createdAt,
    })
    .from(wishlists)
    .innerJoin(wishlistItems, eq(wishlistItems.wishlistId, wishlists.id))
    .innerJoin(products, eq(products.id, wishlistItems.productId))
    .leftJoin(productVariants, eq(productVariants.productId, products.id))
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(eq(wishlists.userId, userId))
    .groupBy(
      wishlists.id,
      products.id,
      products.name,
      products.slug,
      products.basePrice,
      wishlistItems.createdAt,
    )
    .orderBy(desc(wishlistItems.createdAt));
}

export async function insertWishlistItem(
  wishlistId: string,
  productId: string,
  db?: CartDb,
) {
  const client = cartDb(db);
  const [row] = await client
    .insert(wishlistItems)
    .values({ wishlistId, productId })
    .onConflictDoNothing()
    .returning();
  return row ?? null;
}

export async function deleteWishlistItem(
  userId: string,
  productId: string,
  db?: CartDb,
) {
  const wishlist = await findWishlistByUserId(userId, db);
  if (!wishlist) return false;
  const client = cartDb(db);
  const removed = await client
    .delete(wishlistItems)
    .where(
      and(eq(wishlistItems.wishlistId, wishlist.id), eq(wishlistItems.productId, productId)),
    )
    .returning({ productId: wishlistItems.productId });
  return removed.length > 0;
}

export async function findWishlistItem(
  userId: string,
  productId: string,
  db?: CartDb,
) {
  const client = cartDb(db);
  const [row] = await client
    .select({ productId: wishlistItems.productId })
    .from(wishlistItems)
    .innerJoin(wishlists, eq(wishlists.id, wishlistItems.wishlistId))
    .where(and(eq(wishlists.userId, userId), eq(wishlistItems.productId, productId)))
    .limit(1);
  return row ?? null;
}
