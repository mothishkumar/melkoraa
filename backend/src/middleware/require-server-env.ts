import type { NextFunction, Request, Response } from "express";

import { isPublicSupabaseConfigured } from "@/lib/env/public";
import { isServerEnvConfigured } from "@/lib/env/server";

import { sendError } from "../lib/express-response.js";

export function requireServerEnv(req: Request, res: Response, next: NextFunction) {
  if (!isPublicSupabaseConfigured() || !isServerEnvConfigured()) {
    return sendError(
      res,
      "CONFIG",
      "Server environment is not configured. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, and DATABASE_URL in backend/.env.",
      503,
    );
  }
  next();
}
