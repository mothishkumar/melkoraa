import { NextResponse } from "next/server";

import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { isPublicSupabaseConfigured } from "@/lib/env/public";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = getSafeRedirectPath(url.searchParams.get("next"), "/account");

  if (!isPublicSupabaseConfigured()) {
    return NextResponse.redirect(new URL(AUTH_ROUTES.login, url.origin));
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
    logger.warn("auth.callback_failed");
  }

  const login = new URL(AUTH_ROUTES.login, url.origin);
  login.searchParams.set("error", "auth");
  return NextResponse.redirect(login);
}
