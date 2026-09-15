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

export const adminNav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/collections", label: "Collections" },
  { href: "/admin/drops", label: "Drops" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/audit-logs", label: "Audit Logs" },
  { href: "/admin/settings", label: "Settings" },
] as const;
