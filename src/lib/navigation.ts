import type { UserRole } from "@/lib/auth/types";
import { hasMinRole } from "@/lib/auth/permissions";

export const storeNav = [
  { href: "/drop-001", label: "DROP 001" },
  { href: "/products", label: "SHOP" },
  { href: "/about", label: "ABOUT" },
] as const;

export const storeFooterNav = {
  shop: [
    { href: "/products", label: "Shop" },
    { href: "/drop-001", label: "Drop 001" },
    { href: "/wishlist", label: "Wishlist" },
  ],
  about: [
    { href: "/about", label: "The brand" },
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ],
  help: [
    { href: "/account", label: "Account" },
    { href: "/cart", label: "Bag" },
    { href: "/account/orders", label: "Orders" },
  ],
} as const;

export const adminNavItems = [
  { href: "/admin", label: "Dashboard", minRole: "staff" as const },
  { href: "/admin/products", label: "Products", minRole: "staff" as const },
  { href: "/admin/inventory", label: "Inventory", minRole: "staff" as const },
  { href: "/admin/orders", label: "Orders", minRole: "staff" as const },
  { href: "/admin/customers", label: "Customers", minRole: "staff" as const },
  { href: "/admin/drops", label: "Drops", minRole: "staff" as const },
  { href: "/admin/collections", label: "Collections", minRole: "staff" as const },
  { href: "/admin/audit-logs", label: "Audit Logs", minRole: "manager" as const },
] as const;

export const adminNav = adminNavItems.map(({ href, label }) => ({ href, label }));

export function adminNavForRole(role: UserRole) {
  return adminNavItems.filter((item) => hasMinRole(role, item.minRole));
}
