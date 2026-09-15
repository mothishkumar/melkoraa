"use client";

import Link from "next/link";

import { useUiStore } from "@/hooks/use-ui-store";

export function BagLink() {
  const bagCount = useUiStore((state) => state.bagCount);

  return (
    <Link href="/cart" className="label-caps text-[0.65rem] text-off-white/80 hover:text-off-white">
      BAG{bagCount > 0 ? ` (${bagCount})` : ""}
    </Link>
  );
}
