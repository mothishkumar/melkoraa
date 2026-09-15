"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { brand } from "@/lib/brand";
import { storeNav } from "@/lib/navigation";

export function StoreMobileNav() {
  return (
    <Sheet>
      <SheetTrigger
        className="inline-flex size-10 items-center justify-center text-off-white md:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[min(100%,320px)] rounded-none border-white/10 bg-black p-0 text-off-white shadow-none"
      >
        <SheetHeader className="border-b border-white/10 px-6 py-5">
          <SheetTitle className="editorial-display text-left text-sm tracking-[0.3em] text-off-white">
            {brand.name}
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-6 py-8" aria-label="Mobile">
          {storeNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="editorial-display py-3 text-2xl tracking-[0.08em] text-off-white"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/account" className="label-caps mt-8 py-2">
            ACCOUNT
          </Link>
          <Link href="/cart" className="label-caps py-2">
            BAG
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
