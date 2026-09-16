import type { NextFunction, Request, Response } from "express";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isPublicSupabaseConfigured } from "@/lib/env/public";
import { isServerEnvConfigured } from "@/lib/env/server";
import { splitFullName } from "@/lib/auth/names";
import { isUserRole, type Profile, type SessionUser } from "@/lib/auth/types";
import { logger } from "@/lib/logger";

import { createExpressSupabaseClient } from "../lib/supabase.js";
import { sendError } from "../lib/express-response.js";

type ProfileRow = {
  id: string;
  user_id: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

function toProfile(row: ProfileRow): Profile | null {
  if (!isUserRole(row.role)) return null;
  return {
    id: row.id,
    userId: row.user_id,
    role: row.role,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchProfile(
  req: Request,
  res: Response,
  userId: string,
): Promise<Profile | null> {
  const supabase = createExpressSupabaseClient(req, res);
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, user_id, role, first_name, last_name, phone, avatar_url, created_at, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return toProfile(data as ProfileRow);
}

async function repairMissingProfile(
  userId: string,
  user: { user_metadata?: Record<string, unknown> },
): Promise<Profile | null> {
  if (!isServerEnvConfigured()) return null;
  try {
    const admin = createServiceRoleClient();
    const metadata = user.user_metadata ?? {};
    const fullName = typeof metadata.full_name === "string" ? metadata.full_name : "";
    const split = splitFullName(fullName);
    const firstName =
      typeof metadata.first_name === "string" && metadata.first_name.trim()
        ? metadata.first_name.trim()
        : split.firstName || null;
    const lastName =
      typeof metadata.last_name === "string" && metadata.last_name.trim()
        ? metadata.last_name.trim()
        : split.lastName;

    const { error } = await admin.from("profiles").insert({
      user_id: userId,
      role: "customer",
      first_name: firstName,
      last_name: lastName,
    });
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      logger.error("auth.profile_repair_failed");
      return null;
    }
  } catch {
    logger.error("auth.profile_repair_failed");
    return null;
  }
  return null;
}

export async function loadAuthContext(req: Request, res: Response) {
  if (!isPublicSupabaseConfigured()) {
    req.auth = null;
    return;
  }

  const supabase = createExpressSupabaseClient(req, res);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    req.auth = null;
    return;
  }

  const user = data.user as SessionUser;
  let profile = await fetchProfile(req, res, user.id);
  if (!profile) {
    await repairMissingProfile(user.id, user);
    profile = await fetchProfile(req, res, user.id);
  }

  req.auth = profile ? { user, profile } : null;
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  req.auth = null;
  await loadAuthContext(req, res);
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.auth?.user) {
    return sendError(res, "UNAUTHENTICATED", "Sign in required.", 401);
  }
  if (!req.auth.profile) {
    return sendError(res, "PROFILE_INCOMPLETE", "Your account profile is not ready.", 403);
  }
  next();
}

declare global {
  namespace Express {
    interface Request {
      auth: { user: SessionUser; profile: Profile } | null;
    }
  }
}
