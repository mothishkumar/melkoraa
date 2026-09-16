import { wishlistApi } from "@/src/api/wishlist";
import { isAuthRequiredError } from "@/src/api/errors";
import type { WishlistDto } from "@/src/api/types/wishlist";

export type WishlistResult<T> =
  | { status: "success"; data: T }
  | { status: "auth_required" }
  | { status: "error"; message: string };

async function wrap<T>(fn: () => Promise<T>): Promise<WishlistResult<T>> {
  try {
    const data = await fn();
    return { status: "success", data };
  } catch (error) {
    if (isAuthRequiredError(error)) {
      return { status: "auth_required" };
    }
    const message =
      error instanceof Error ? error.message : "Unable to update wishlist.";
    return { status: "error", message };
  }
}

export const wishlistService = {
  getWishlist(): Promise<WishlistResult<WishlistDto>> {
    return wrap(() => wishlistApi.get());
  },

  toggleItem(productId: string): Promise<WishlistResult<WishlistDto>> {
    return wrap(() => wishlistApi.toggleItem(productId));
  },

  addItem(productId: string): Promise<WishlistResult<WishlistDto>> {
    return wrap(() => wishlistApi.addItem(productId));
  },

  removeItem(productId: string): Promise<WishlistResult<WishlistDto>> {
    return wrap(() => wishlistApi.removeItem(productId));
  },
};
