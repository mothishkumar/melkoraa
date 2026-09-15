import type { ReactNode } from "react";

import { BagCountSync } from "@/components/cart/bag-count-sync";
import { StoreFooter } from "@/components/layout/store-footer";
import { StoreHeader } from "@/components/layout/store-header";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { hasStaffAccess } from "@/lib/auth/permissions";
import { getCart } from "@/server/services/cart/cart-service";

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);
  let bagCount = 0;
  if (user) {
    const cart = await getCart(user.id);
    bagCount = cart.itemCount;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-black text-off-white">
      <BagCountSync count={bagCount} />
      <StoreHeader
        isAuthenticated={Boolean(user)}
        isStaff={hasStaffAccess(profile?.role)}
      />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  );
}
