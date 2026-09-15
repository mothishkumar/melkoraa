import Link from "next/link";

import { brand } from "@/lib/brand";

export const metadata = {
  title: "Unauthorized",
};

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-black text-off-white">
      <header className="border-b border-white/10 px-6 py-6 md:px-10">
        <Link href="/" className="editorial-display text-lg tracking-[0.28em]">
          {brand.name}
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
        <p className="label-caps">Access</p>
        <h1 className="editorial-display mt-4 text-4xl">Unauthorized</h1>
        <p className="mt-6 text-sm leading-7 text-stone">
          You do not have permission to view this page. Customer accounts stay in
          the storefront. Staff access is granted from the operations console only.
        </p>
        <div className="mt-10 flex flex-col gap-4 text-sm">
          <Link href="/account" className="label-caps text-off-white hover:text-stone">
            Return to account
          </Link>
          <Link href="/" className="label-caps text-stone hover:text-off-white">
            Back to store
          </Link>
        </div>
      </main>
    </div>
  );
}
