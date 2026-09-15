"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { brand } from "@/lib/brand";
import { adminNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-white/10 bg-black md:flex md:flex-col">
      <div className="border-b border-white/10 px-6 py-6">
        <Link href="/admin" className="editorial-display text-sm tracking-[0.28em]">
          {brand.name}
        </Link>
        <p className="label-caps mt-3">Admin</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-6" aria-label="Admin">
        {adminNav.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-2 text-sm tracking-wide text-stone transition-colors hover:text-off-white",
                active && "bg-charcoal text-off-white",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-6 py-4">
        <Link href="/" className="label-caps text-[0.6rem]">
          View store
        </Link>
      </div>
    </aside>
  );
}
