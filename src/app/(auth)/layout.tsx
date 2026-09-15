import type { ReactNode } from "react";
import Link from "next/link";

import { brand } from "@/lib/brand";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-black text-off-white">
      <header className="border-b border-white/10 px-6 py-6 md:px-10">
        <Link href="/" className="editorial-display text-lg tracking-[0.28em]">
          {brand.name}
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-16">{children}</main>
    </div>
  );
}
