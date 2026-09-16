import type { UserRole } from "@/lib/auth/types";
import { hasMinRole } from "@/lib/auth/permissions";

export const adminNavItems = [
  { href: "/", label: "Dashboard", minRole: "staff" as const },
  { href: "/products", label: "Products", minRole: "staff" as const },
  { href: "/inventory", label: "Inventory", minRole: "staff" as const },
  { href: "/orders", label: "Orders", minRole: "staff" as const },
  { href: "/customers", label: "Customers", minRole: "staff" as const },
  { href: "/drops", label: "Drops", minRole: "staff" as const },
  { href: "/collections", label: "Collections", minRole: "staff" as const },
  { href: "/audit-logs", label: "Audit Logs", minRole: "manager" as const },
] as const;

export function adminNavForRole(role: UserRole) {
  return adminNavItems.filter((item) => hasMinRole(role, item.minRole));
}
