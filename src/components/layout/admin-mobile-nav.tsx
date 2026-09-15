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
import { adminNav } from "@/lib/navigation";

export function AdminMobileNav() {
  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger
          className="inline-flex size-10 items-center justify-center text-off-white"
          aria-label="Open admin menu"
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[min(100%,280px)] rounded-none border-white/10 bg-black p-0 text-off-white shadow-none"
        >
          <SheetHeader className="border-b border-white/10 px-6 py-5">
            <SheetTitle className="editorial-display text-left text-sm tracking-[0.28em] text-off-white">
              ADMIN
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col px-4 py-6">
            {adminNav.map((item) => (
              <Link key={item.href} href={item.href} className="px-2 py-2 text-sm text-stone">
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
