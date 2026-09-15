import { apiRequest } from "@/lib/api/client";
import type { CartDto } from "@/types/cart";

export function addCartItemRequest(variantId: string, quantity: number) {
  return apiRequest<CartDto>("/api/v1/cart/items", {
    method: "POST",
    body: JSON.stringify({ variantId, quantity }),
  });
}

export function updateCartItemRequest(variantId: string, quantity: number) {
  return apiRequest<CartDto>(`/api/v1/cart/items/${variantId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

export function removeCartItemRequest(variantId: string) {
  return apiRequest<CartDto>(`/api/v1/cart/items/${variantId}`, { method: "DELETE" });
}

export function clearCartRequest() {
  return apiRequest<CartDto>("/api/v1/cart", { method: "DELETE" });
}

export function getCartRequest() {
  return apiRequest<CartDto>("/api/v1/cart");
}
