import type { ReactNode } from "react";

import { StoreFooter } from "@/components/layout/store-footer";
import { StoreHeader } from "@/components/layout/store-header";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-black text-off-white">
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  );
}
