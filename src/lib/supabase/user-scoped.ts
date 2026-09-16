import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { requirePublicSupabaseEnv } from "@/lib/env/public";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createUserScopedSupabaseClient(
  accessToken?: string | null,
): Promise<SupabaseClient> {
  if (accessToken) {
    const env = requirePublicSupabaseEnv();
    return createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }

  return await createServerSupabaseClient();
}
