import type { ReactNode } from "react";

import { StoreFooter } from "@/components/layout/store-footer";
import { StoreHeader } from "@/components/layout/store-header";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { hasStaffAccess } from "@/lib/auth/permissions";

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-black text-off-white">
      <StoreHeader
        isAuthenticated={Boolean(user)}
        isStaff={hasStaffAccess(profile?.role)}
      />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  );
}
