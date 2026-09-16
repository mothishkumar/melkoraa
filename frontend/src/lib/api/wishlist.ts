import { apiRequest } from "@/lib/api/client";
import type { WishlistDto } from "@/types/wishlist";

export function toggleWishlistRequest(productId: string) {
  return apiRequest<WishlistDto>("/api/v1/wishlist/items/toggle", {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
}

export function removeWishlistRequest(productId: string) {
  return apiRequest<WishlistDto>(`/api/v1/wishlist/items/${productId}`, { method: "DELETE" });
}
