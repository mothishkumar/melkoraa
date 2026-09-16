import { apiRequest } from "@/src/api/client";
import type { WishlistDto } from "@/src/api/types/wishlist";

export const wishlistApi = {
  get() {
    return apiRequest<WishlistDto>("/wishlist", { authenticated: true });
  },

  addItem(productId: string) {
    return apiRequest<WishlistDto>("/wishlist/items", {
      method: "POST",
      body: JSON.stringify({ productId }),
      authenticated: true,
    });
  },

  toggleItem(productId: string) {
    return apiRequest<WishlistDto>("/wishlist/items/toggle", {
      method: "POST",
      body: JSON.stringify({ productId }),
      authenticated: true,
    });
  },

  removeItem(productId: string) {
    return apiRequest<WishlistDto>(
      `/wishlist/items/${encodeURIComponent(productId)}`,
      {
        method: "DELETE",
        authenticated: true,
      },
    );
  },
};
