import "server-only";

import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import {
  defaultPostLoginPath,
  hasMinRole,
  hasStaffAccess,
  isAdmin,
  isManager,
} from "@/lib/auth/permissions";
import { requireAuth } from "@/lib/auth/require-auth";
import type { AuthenticatedContext, UserRole } from "@/lib/auth/types";

export async function requireRole(
  minimum: UserRole,
  nextPath = "/admin",
): Promise<AuthenticatedContext> {
  const ctx = await requireAuth(nextPath);
  if (!hasMinRole(ctx.profile.role, minimum)) {
    redirect("/unauthorized");
  }
  return ctx;
}

export async function requireStaff(): Promise<AuthenticatedContext> {
  const ctx = await requireAuth("/admin");
  if (!hasStaffAccess(ctx.profile.role)) {
    redirect("/unauthorized");
  }
  return ctx;
}

export async function requireManager(): Promise<AuthenticatedContext> {
  const ctx = await requireAuth("/admin");
  if (!isManager(ctx.profile.role)) {
    redirect("/unauthorized");
  }
  return ctx;
}

export async function requireAdmin(): Promise<AuthenticatedContext> {
  const ctx = await requireAuth("/admin");
  if (!isAdmin(ctx.profile.role)) {
    redirect("/unauthorized");
  }
  return ctx;
}

export async function redirectIfAuthenticated(fallback?: string) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return;
  }
  redirect(fallback ?? defaultPostLoginPath(profile.role));
}
