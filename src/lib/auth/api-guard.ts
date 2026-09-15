import "server-only";

import {
  hasMinRole,
  hasStaffAccess,
  isAdmin,
  isManager,
} from "@/lib/auth/permissions";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import type { AuthenticatedContext, UserRole } from "@/lib/auth/types";
import { jsonError } from "@/server/http";

export type ApiGuardOk = { ok: true } & AuthenticatedContext;
export type ApiGuardFail = { ok: false; response: Response };
export type ApiGuardResult = ApiGuardOk | ApiGuardFail;

export async function requireApiAuth(): Promise<ApiGuardResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: jsonError("UNAUTHENTICATED", "Sign in required.", 401),
    };
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return {
      ok: false,
      response: jsonError(
        "PROFILE_INCOMPLETE",
        "Your account profile is not ready.",
        403,
      ),
    };
  }

  return { ok: true, user, profile };
}

export async function requireApiRole(minimum: UserRole): Promise<ApiGuardResult> {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth;

  if (!hasMinRole(auth.profile.role, minimum)) {
    return {
      ok: false,
      response: jsonError(
        "FORBIDDEN",
        "You do not have permission to perform this action.",
        403,
      ),
    };
  }

  return auth;
}

export async function requireApiStaff() {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth;
  if (!hasStaffAccess(auth.profile.role)) {
    return {
      ok: false,
      response: jsonError(
        "FORBIDDEN",
        "You do not have permission to perform this action.",
        403,
      ),
    } satisfies ApiGuardFail;
  }
  return auth;
}

export async function requireApiManager() {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth;
  if (!isManager(auth.profile.role)) {
    return {
      ok: false,
      response: jsonError(
        "FORBIDDEN",
        "You do not have permission to perform this action.",
        403,
      ),
    } satisfies ApiGuardFail;
  }
  return auth;
}

export async function requireApiAdmin() {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth;
  if (!isAdmin(auth.profile.role)) {
    return {
      ok: false,
      response: jsonError(
        "FORBIDDEN",
        "You do not have permission to perform this action.",
        403,
      ),
    } satisfies ApiGuardFail;
  }
  return auth;
}
