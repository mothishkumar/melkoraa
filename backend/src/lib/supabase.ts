import { createServerClient } from "@supabase/ssr";
import type { CookieOptions, Request, Response } from "express";

import { requirePublicSupabaseEnv } from "@/lib/env/public";

export function createExpressSupabaseClient(req: Request, res: Response) {
  const env = requirePublicSupabaseEnv();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return Object.entries(req.cookies ?? {}).map(([name, value]) => ({
          name,
          value: String(value),
        }));
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookie(name, value, {
            ...options,
            httpOnly: options.httpOnly ?? true,
            sameSite: (options.sameSite as "lax" | "strict" | "none" | undefined) ?? "lax",
            secure: options.secure ?? process.env.NODE_ENV === "production",
          });
        });
      },
    },
  });
}
