import { useCallback, useEffect, useState } from "react";

import type { CartDto } from "@/src/api/types/cart";
import { cartService } from "@/src/services/cart.service";
import { useAuth } from "@/src/auth/auth-context";

type CartState = {
  cart: CartDto | null;
  loading: boolean;
  refreshing: boolean;
  authRequired: boolean;
  error: string | null;
  mutating: boolean;
};

export function useCart() {
  const { session } = useAuth();
  const [state, setState] = useState<CartState>({
    cart: null,
    loading: true,
    refreshing: false,
    authRequired: false,
    error: null,
    mutating: false,
  });

  const load = useCallback(
    async (refreshing = false) => {
      if (!session) {
        setState({
          cart: null,
          loading: false,
          refreshing: false,
          authRequired: true,
          error: null,
          mutating: false,
        });
        return;
      }

      setState((prev) => ({
        ...prev,
        loading: !refreshing,
        refreshing,
        authRequired: false,
        error: null,
      }));

      const result = await cartService.getCart();
      if (result.status === "auth_required") {
        setState((prev) => ({
          ...prev,
          cart: null,
          loading: false,
          refreshing: false,
          authRequired: true,
          error: null,
        }));
        return;
      }
      if (result.status === "error") {
        setState((prev) => ({
          ...prev,
          cart: null,
          loading: false,
          refreshing: false,
          error: result.message,
        }));
        return;
      }
      setState((prev) => ({
        ...prev,
        cart: result.data,
        loading: false,
        refreshing: false,
        error: null,
      }));
    },
    [session],
  );

  useEffect(() => {
    load();
  }, [load]);

  const mutate = useCallback(
    async (action: () => ReturnType<typeof cartService.addItem>) => {
      setState((prev) => ({ ...prev, mutating: true, error: null }));
      const result = await action();
      if (result.status === "auth_required") {
        setState((prev) => ({
          ...prev,
          mutating: false,
          authRequired: true,
        }));
        return result;
      }
      if (result.status === "error") {
        setState((prev) => ({ ...prev, mutating: false, error: result.message }));
        return result;
      }
      setState((prev) => ({
        ...prev,
        cart: result.data,
        mutating: false,
        authRequired: false,
      }));
      return result;
    },
    [],
  );

  return {
    ...state,
    refresh: () => load(true),
    addItem: (variantId: string, quantity: number) =>
      mutate(() => cartService.addItem({ variantId, quantity })),
    updateItem: (variantId: string, quantity: number) =>
      mutate(() => cartService.updateItem(variantId, { quantity })),
    removeItem: (variantId: string) =>
      mutate(() => cartService.removeItem(variantId)),
    clearCart: () => mutate(() => cartService.clearCart()),
  };
}
