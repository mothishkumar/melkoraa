import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isPublicSupabaseConfigured } from "@/lib/env/public";
import type { SessionUser } from "@/lib/auth/types";

export async function getCurrentUser(): Promise<SessionUser | null> {
  if (!isPublicSupabaseConfigured()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

/** @deprecated Use getCurrentUser */
export async function getSessionUser() {
  return getCurrentUser();
}
