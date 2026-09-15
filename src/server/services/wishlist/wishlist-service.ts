import { getDb } from "@/db";
import { logger } from "@/lib/logger";
import { conflictError, notFoundError } from "@/server/errors";
import * as wishlistRepo from "@/server/repositories/wishlist/wishlist-repository";
import {
  emptyWishlist,
  mapWishlist,
  mapWishlistItem,
} from "@/server/services/wishlist/mappers";
import type { WishlistDto } from "@/types/wishlist";

function requirePublicProduct(
  product: Awaited<ReturnType<typeof wishlistRepo.findPublicProduct>>,
) {
  if (!product || product.status !== "active") {
    throw notFoundError("PRODUCT_UNAVAILABLE", "This product is not available.");
  }
  return product;
}

async function loadWishlistDto(userId: string): Promise<WishlistDto> {
  const wishlist = await wishlistRepo.findWishlistByUserId(userId);
  if (!wishlist) return emptyWishlist();
  const lines = await wishlistRepo.listWishlistLines(userId);
  return mapWishlist(wishlist.id, lines.map(mapWishlistItem));
}

export async function getWishlist(userId: string): Promise<WishlistDto> {
  return loadWishlistDto(userId);
}

export async function addWishlistItem(userId: string, productId: string): Promise<WishlistDto> {
  requirePublicProduct(await wishlistRepo.findPublicProduct(productId));
  const db = getDb();
  const inserted = await db.transaction(async (tx) => {
    const wishlist = await wishlistRepo.getOrCreateWishlist(userId, tx);
    return wishlistRepo.insertWishlistItem(wishlist.id, productId, tx);
  });
  if (!inserted) {
    throw conflictError("WISHLIST_ITEM_EXISTS", "This product is already in your wishlist.");
  }
  logger.info("wishlist.item_added", { resourceId: productId });
  return loadWishlistDto(userId);
}

export async function removeWishlistItem(
  userId: string,
  productId: string,
): Promise<WishlistDto> {
  const removed = await wishlistRepo.deleteWishlistItem(userId, productId);
  if (!removed) {
    throw notFoundError("WISHLIST_ITEM_NOT_FOUND", "That product is not in your wishlist.");
  }
  logger.info("wishlist.item_removed", { resourceId: productId });
  return loadWishlistDto(userId);
}

export async function toggleWishlistItem(
  userId: string,
  productId: string,
): Promise<WishlistDto> {
  const existing = await wishlistRepo.findWishlistItem(userId, productId);
  if (existing) {
    return removeWishlistItem(userId, productId);
  }
  return addWishlistItem(userId, productId);
}
