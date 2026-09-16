import Link from "next/link";

import { StoreSurface } from "@/components/layout/store-surface";
import { LogoutButton } from "@/features/auth";
import { displayName } from "@/lib/auth/names";
import { requireAuth } from "@/lib/auth/require-auth";
import { hasStaffAccess } from "@/lib/auth/permissions";

export const metadata = {
  title: "Account",
};

export default async function AccountPage() {
  const { user, profile } = await requireAuth("/account");
  const name = displayName({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: user.email,
  });

  return (
    <StoreSurface>
      <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
        <p className="label-caps">Account</p>
        <h1 className="editorial-display mt-4 text-4xl md:text-6xl">{name}</h1>
        <p className="mt-4 text-sm text-[#6f6b66]">{user.email}</p>

        <ul className="mt-12 flex flex-col gap-4 text-sm tracking-[0.16em] uppercase text-[#6f6b66]">
          <li>
            <Link href="/account/orders" className="hover:text-[#111]">
              Orders
            </Link>
          </li>
          <li>
            <Link href="/account/addresses" className="hover:text-[#111]">
              Addresses
            </Link>
          </li>
          <li>
            <Link href="/wishlist" className="hover:text-[#111]">
              Wishlist
            </Link>
          </li>
          {hasStaffAccess(profile.role) ? (
            <li>
              <Link href="/admin" className="hover:text-[#111]">
                Operations
              </Link>
            </li>
          ) : null}
        </ul>

        <div className="mt-12">
          <LogoutButton className="border border-black/20 px-6 py-3 text-[#111]" />
        </div>
      </div>
    </StoreSurface>
  );
}
