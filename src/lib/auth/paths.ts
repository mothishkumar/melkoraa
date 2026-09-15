export const protectedPathPrefixes = [
  "/account",
  "/checkout",
  "/admin",
] as const;

export function isProtectedPath(pathname: string): boolean {
  return protectedPathPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
