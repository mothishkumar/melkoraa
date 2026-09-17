import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function StoreSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("store-light bg-[#f6f3ee] text-[#111111]", className)}>
      {children}
    </div>
  );
}
