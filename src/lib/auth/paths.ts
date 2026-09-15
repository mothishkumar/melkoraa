export const protectedPathPrefixes = [
  "/account",
  "/checkout",
  "/wishlist",
  "/order",
  "/admin",
] as const;

export function isProtectedPath(pathname: string): boolean {
  return protectedPathPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
