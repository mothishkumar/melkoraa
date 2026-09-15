import { jsonError } from "@/server/http";
import { isPublicSupabaseConfigured } from "@/lib/env/public";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  if (!isPublicSupabaseConfigured()) {
    return jsonError("UNAUTHENTICATED", "Sign in required.", 401);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return jsonError("UNAUTHENTICATED", "Sign in required.", 401);
    }
    await supabase.auth.signOut();
  } catch {
    logger.warn("auth.api_logout_failed");
    return jsonError("INTERNAL", "Something went wrong. Please try again.", 500);
  }

  return Response.json({ data: { signedOut: true } });
}
