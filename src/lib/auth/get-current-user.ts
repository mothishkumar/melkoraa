import "server-only";

import { cache } from "react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isPublicSupabaseConfigured } from "@/lib/env/public";
import type { SessionUser } from "@/lib/auth/types";

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  if (!isPublicSupabaseConfigured()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
});

/** @deprecated Use getCurrentUser */
export async function getSessionUser() {
  return getCurrentUser();
}
