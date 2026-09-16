import { Outlet } from "react-router-dom";
import { useEffect } from "react";

import { BagCountSync } from "@/components/cart/bag-count-sync";
import { BagToast } from "@/components/cart/bag-toast";
import { StoreFooter } from "@/components/layout/store-footer";
import { StoreHeader } from "@/components/layout/store-header";
import { useAuth } from "@/contexts/auth-context";
import { getCartRequest } from "@/lib/api/cart";
import { useUiStore } from "@/hooks/use-ui-store";

export function StoreLayout() {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      useUiStore.setState({ bagCount: 0 });
      return;
    }
    void getCartRequest()
      .then((cart) => useUiStore.setState({ bagCount: cart.itemCount }))
      .catch(() => useUiStore.setState({ bagCount: 0 }));
  }, [isAuthenticated, user?.id]);

  const isStaff = user?.role === "staff" || user?.role === "manager" || user?.role === "admin";

  return (
    <div className="flex min-h-full min-w-0 flex-1 flex-col overflow-x-hidden bg-black text-off-white">
      <BagCountSync count={useUiStore((s) => s.bagCount)} />
      <BagToast />
      <StoreHeader isAuthenticated={isAuthenticated} isStaff={isStaff} />
      <main className="flex-1">
        <Outlet />
      </main>
      <StoreFooter />
    </div>
  );
}
