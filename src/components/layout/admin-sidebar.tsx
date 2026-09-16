"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingBag,
  Users,
  Layers,
  FolderKanban,
  ScrollText,
} from "lucide-react";

import { brand } from "@/lib/brand";
import { adminNavForRole } from "@/lib/navigation";
import type { UserRole } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

const icons: Record<string, typeof LayoutDashboard> = {
  "/admin": LayoutDashboard,
  "/admin/products": Package,
  "/admin/inventory": Warehouse,
  "/admin/orders": ShoppingBag,
  "/admin/customers": Users,
  "/admin/drops": Layers,
  "/admin/collections": FolderKanban,
  "/admin/audit-logs": ScrollText,
};

export function AdminSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = adminNavForRole(role);

  return (
    <aside className="relative hidden w-64 shrink-0 overflow-hidden md:flex md:flex-col">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,8,8,0.55) 0%, rgba(8,8,8,0.92) 100%), radial-gradient(ellipse at 30% 20%, #3a3a3a, #0b0b0b 70%)",
        }}
      />
      <div className="relative z-10 flex h-full flex-col text-off-white">
        <div className="px-6 py-7">
          <Link href="/admin" className="editorial-display text-sm tracking-[0.38em]">
            {brand.name}
          </Link>
          <p className="mt-2 text-[0.6rem] uppercase tracking-[0.22em] text-white/50">
            A higher tomorrow
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2" aria-label="Admin">
          {items.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = icons[item.href] ?? Package;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/65 transition-colors hover:bg-white/10 hover:text-white",
                  active && "bg-white/12 text-white",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-5 text-[0.65rem] uppercase tracking-[0.16em] text-white/40">
          <Link href="/" className="hover:text-white">
            View store
          </Link>
        </div>
      </div>
    </aside>
  );
}
