"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { brand } from "@/lib/brand";
import { adminNavForRole } from "@/lib/navigation";
import type { UserRole } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

export function AdminSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = adminNavForRole(role);

  return (
    <aside className="hidden w-56 shrink-0 border-r border-white/10 bg-zinc-950 md:flex md:flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/admin" className="text-xs font-semibold tracking-[0.2em] uppercase">
          {brand.name}
        </Link>
        <p className="mt-2 text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">Operations</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-4" aria-label="Admin">
        {items.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-none px-3 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground",
                active && "bg-white/10 text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-5 py-4">
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
          View store
        </Link>
      </div>
    </aside>
  );
}
