import { FoundationNotice } from "@/components/common/foundation-notice";
import Link from "next/link";

export const metadata = {
  title: "Account",
};

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-24">
      <FoundationNotice
        title="ACCOUNT"
        description="Profile management requires Supabase Auth, which is not fully implemented in this phase."
      />
      <ul className="mt-10 flex flex-col gap-4 text-sm tracking-[0.16em] uppercase text-stone">
        <li>
          <Link href="/account/orders" className="hover:text-off-white">
            Orders
          </Link>
        </li>
        <li>
          <Link href="/account/addresses" className="hover:text-off-white">
            Addresses
          </Link>
        </li>
      </ul>
    </div>
  );
}
