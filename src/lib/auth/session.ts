import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isPublicSupabaseConfigured } from "@/lib/env/public";

export async function getSessionUser() {
  if (!isPublicSupabaseConfigured()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}
