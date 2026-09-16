import { useCallback, useEffect, useMemo, useState } from "react";

import type { WishlistDto } from "@/src/api/types/wishlist";
import { wishlistService } from "@/src/services/wishlist.service";
import { useAuth } from "@/src/auth/auth-context";

export function useWishlist() {
  const { session } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) {
      setWishlist(null);
      setAuthRequired(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const result = await wishlistService.getWishlist();
    if (result.status === "auth_required") {
      setWishlist(null);
      setAuthRequired(true);
    } else if (result.status === "error") {
      setError(result.message);
      setWishlist(null);
    } else {
      setWishlist(result.data);
      setAuthRequired(false);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const productIds = useMemo(
    () => new Set(wishlist?.items.map((item) => item.productId) ?? []),
    [wishlist],
  );

  const toggle = useCallback(
    async (productId: string) => {
      if (!session) {
        return { status: "auth_required" as const };
      }
      const result = await wishlistService.toggleItem(productId);
      if (result.status === "success") {
        setWishlist(result.data);
        setAuthRequired(false);
      } else if (result.status === "auth_required") {
        setAuthRequired(true);
      } else if (result.status === "error") {
        setError(result.message);
      }
      return result;
    },
    [session],
  );

  const isSaved = useCallback(
    (productId: string) => productIds.has(productId),
    [productIds],
  );

  return {
    wishlist,
    loading,
    authRequired,
    error,
    refresh: load,
    toggle,
    isSaved,
    isAuthenticated: Boolean(session),
  };
}
