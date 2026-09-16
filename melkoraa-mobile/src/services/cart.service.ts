import { cartApi } from "@/src/api/cart";
import { isAuthRequiredError } from "@/src/api/errors";
import type { AddCartItemInput, CartDto, UpdateCartItemInput } from "@/src/api/types/cart";

export type CartResult<T> =
  | { status: "success"; data: T }
  | { status: "auth_required" }
  | { status: "error"; message: string };

async function wrap<T>(fn: () => Promise<T>): Promise<CartResult<T>> {
  try {
    const data = await fn();
    return { status: "success", data };
  } catch (error) {
    if (isAuthRequiredError(error)) {
      return { status: "auth_required" };
    }
    const message =
      error instanceof Error ? error.message : "Unable to update cart.";
    return { status: "error", message };
  }
}

export const cartService = {
  getCart(): Promise<CartResult<CartDto>> {
    return wrap(() => cartApi.get());
  },

  addItem(input: AddCartItemInput): Promise<CartResult<CartDto>> {
    return wrap(() => cartApi.addItem(input));
  },

  updateItem(variantId: string, input: UpdateCartItemInput): Promise<CartResult<CartDto>> {
    return wrap(() => cartApi.updateItem(variantId, input));
  },

  removeItem(variantId: string): Promise<CartResult<CartDto>> {
    return wrap(() => cartApi.removeItem(variantId));
  },

  clearCart(): Promise<CartResult<CartDto>> {
    return wrap(() => cartApi.clear());
  },
};
