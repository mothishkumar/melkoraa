import type { UserRole } from "@/lib/auth/types";

const ROLE_RANK: Record<UserRole, number> = {
  customer: 0,
  staff: 1,
  manager: 2,
  admin: 3,
};

export function hasMinRole(role: UserRole, minimum: UserRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function hasStaffAccess(role: UserRole | null | undefined): boolean {
  return role === "staff" || role === "manager" || role === "admin";
}

export function isManager(role: UserRole | null | undefined): boolean {
  return role === "manager" || role === "admin";
}

export function isAdmin(role: UserRole | null | undefined): boolean {
  return role === "admin";
}

export function defaultPostLoginPath(role: UserRole): string {
  return hasStaffAccess(role) ? "/admin" : "/account";
}

export function canAccessAdmin(role: UserRole | null | undefined): boolean {
  return hasStaffAccess(role);
}

export function resolvePostLoginPath(
  role: UserRole,
  next: string | null | undefined,
  getSafe: (raw: string | null | undefined, fallback: string) => string,
  unauthorizedPath = "/unauthorized",
): string {
  const fallback = defaultPostLoginPath(role);
  const dest = getSafe(next, fallback);
  if (dest.startsWith("/admin") && !hasStaffAccess(role)) {
    return unauthorizedPath;
  }
  return dest;
}
