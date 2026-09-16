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
import { adminNavForRole } from "@/lib/navigation";
import type { UserRole } from "@/lib/auth/types";

export function AdminMobileNav({ role }: { role: UserRole }) {
  const items = adminNavForRole(role);
  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger
          className="inline-flex size-10 items-center justify-center"
          aria-label="Open admin menu"
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent
          side="left"
        className="w-[min(100%,280px)] rounded-none border-white/10 bg-[#0b0b0b] p-0 text-off-white shadow-none"
        >
          <SheetHeader className="border-b border-white/10 px-5 py-4">
            <SheetTitle className="text-left text-sm tracking-[0.16em] uppercase">Operations</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col px-3 py-4">
            {items.map((item) => (
              <Link key={item.href} href={item.href} className="px-2 py-2 text-sm text-white/70 hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
