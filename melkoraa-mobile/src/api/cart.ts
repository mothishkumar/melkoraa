import { apiRequest } from "@/src/api/client";
import type {
  AddCartItemInput,
  CartDto,
  UpdateCartItemInput,
} from "@/src/api/types/cart";

export const cartApi = {
  get() {
    return apiRequest<CartDto>("/cart", { authenticated: true });
  },

  clear() {
    return apiRequest<CartDto>("/cart", {
      method: "DELETE",
      authenticated: true,
    });
  },

  addItem(input: AddCartItemInput) {
    return apiRequest<CartDto>("/cart/items", {
      method: "POST",
      body: JSON.stringify(input),
      authenticated: true,
    });
  },

  updateItem(variantId: string, input: UpdateCartItemInput) {
    return apiRequest<CartDto>(`/cart/items/${encodeURIComponent(variantId)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
      authenticated: true,
    });
  },

  removeItem(variantId: string) {
    return apiRequest<CartDto>(`/cart/items/${encodeURIComponent(variantId)}`, {
      method: "DELETE",
      authenticated: true,
    });
  },
};
