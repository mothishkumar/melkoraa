import "server-only";

import { resolveRequestAuth } from "@/lib/auth/request-auth";
import { isPublicSupabaseConfigured } from "@/lib/env/public";
import type { SessionUser } from "@/lib/auth/types";

export async function getCurrentUser(): Promise<SessionUser | null> {
  if (!isPublicSupabaseConfigured()) {
    return null;
  }

  const auth = await resolveRequestAuth();
  return auth.user;
}

/** @deprecated Use getCurrentUser */
export async function getSessionUser() {
  return getCurrentUser();
}
