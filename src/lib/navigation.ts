export const storeNav = [
  { href: "/shop", label: "SHOP" },
  { href: "/collection/the-builder", label: "COLLECTION" },
  { href: "/about", label: "ABOUT" },
  { href: "/journal", label: "JOURNAL" },
] as const;

export const storeFooterNav = {
  shop: [
    { href: "/shop", label: "Shop" },
    { href: "/collection/the-builder", label: "Drop 001" },
    { href: "/wishlist", label: "Wishlist" },
  ],
  about: [
    { href: "/about", label: "The brand" },
    { href: "/journal", label: "Journal" },
  ],
  help: [
    { href: "/account", label: "Account" },
    { href: "/cart", label: "Bag" },
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
