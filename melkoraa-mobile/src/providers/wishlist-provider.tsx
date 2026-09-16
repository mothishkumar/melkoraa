import { router } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { WishlistDto } from "@/src/api/types/wishlist";
import { wishlistService } from "@/src/services/wishlist.service";
import { useAuth } from "@/src/auth/auth-context";

type WishlistContextValue = {
  wishlist: WishlistDto | null;
  loading: boolean;
  authRequired: boolean;
  togglingId: string | null;
  isSaved: (productId: string) => boolean;
  isToggling: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session) {
      setWishlist(null);
      setAuthRequired(true);
      return;
    }
    setLoading(true);
    const result = await wishlistService.getWishlist();
    if (result.status === "success") {
      setWishlist(result.data);
      setAuthRequired(false);
    } else if (result.status === "auth_required") {
      setWishlist(null);
      setAuthRequired(true);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const productIds = useMemo(
    () => new Set(wishlist?.items.map((item) => item.productId) ?? []),
    [wishlist],
  );

  const toggle = useCallback(
    async (productId: string) => {
      if (togglingId) return;
      if (!session) {
        router.push("/(auth)/login");
        return;
      }
      setTogglingId(productId);
      try {
        const result = await wishlistService.toggleItem(productId);
        if (result.status === "success") {
          setWishlist(result.data);
          setAuthRequired(false);
        } else if (result.status === "auth_required") {
          setAuthRequired(true);
          router.push("/(auth)/login");
        }
      } finally {
        setTogglingId(null);
      }
    },
    [session, togglingId],
  );

  const value = useMemo(
    () => ({
      wishlist,
      loading,
      authRequired,
      togglingId,
      isSaved: (productId: string) => productIds.has(productId),
      isToggling: (productId: string) => togglingId === productId,
      toggle,
      refresh,
    }),
    [wishlist, loading, authRequired, togglingId, productIds, toggle, refresh],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlistContext() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlistContext must be used within WishlistProvider");
  }
  return context;
}
