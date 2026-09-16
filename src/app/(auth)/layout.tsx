import type { ReactNode } from "react";

import { BrandMark } from "@/components/layout/brand-mark";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col overflow-x-hidden bg-black text-off-white">
      <header className="border-b border-white/10 px-6 py-6 md:px-10">
        <BrandMark className="text-lg text-off-white" />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-16">{children}</main>
    </div>
  );
}
