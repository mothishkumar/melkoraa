import { createServiceRoleClient } from "@/lib/supabase/admin";

/** Express runtime shim — admin storage paths only; storefront uses Drizzle repositories. */
export async function createServerSupabaseClient() {
  return createServiceRoleClient();
}
