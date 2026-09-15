import { createBrowserClient } from "@supabase/ssr";

import { requirePublicSupabaseEnv } from "@/lib/env/public";

export function createBrowserSupabaseClient() {
  const env = requirePublicSupabaseEnv();

  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
