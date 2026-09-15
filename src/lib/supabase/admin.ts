import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/lib/env/server";

/**
 * Privileged Supabase client.
 * Import only from trusted server modules (Route Handlers, services, jobs).
 * Never import this file from Client Components.
 */
export function createServiceRoleClient() {
  const env = getServerEnv();

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
