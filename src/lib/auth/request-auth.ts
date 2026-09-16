import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

import { readBearerTokenFromHeaders } from "@/lib/auth/bearer-token";
import type { SessionUser } from "@/lib/auth/types";
import { isPublicSupabaseConfigured, requirePublicSupabaseEnv } from "@/lib/env/public";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type RequestAuthMethod = "cookie" | "bearer";

export type RequestAuth = {
  user: SessionUser | null;
  accessToken: string | null;
  method: RequestAuthMethod | null;
};

export const resolveRequestAuth = cache(async (): Promise<RequestAuth> => {
  if (!isPublicSupabaseConfigured()) {
    return { user: null, accessToken: null, method: null };
  }

  const cookieClient = await createServerSupabaseClient();
  const { data: cookieData, error: cookieError } = await cookieClient.auth.getUser();

  if (!cookieError && cookieData.user) {
    return {
      user: cookieData.user,
      accessToken: null,
      method: "cookie",
    };
  }

  const bearerToken = readBearerTokenFromHeaders(await headers());
  if (!bearerToken) {
    return { user: null, accessToken: null, method: null };
  }

  const env = requirePublicSupabaseEnv();
  const bearerClient = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const { data: bearerData, error: bearerError } =
    await bearerClient.auth.getUser(bearerToken);

  if (bearerError || !bearerData.user) {
    return { user: null, accessToken: null, method: null };
  }

  return {
    user: bearerData.user,
    accessToken: bearerToken,
    method: "bearer",
  };
});
