import "server-only";

import { cache } from "react";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isPublicSupabaseConfigured } from "@/lib/env/public";
import { isServerEnvConfigured } from "@/lib/env/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { splitFullName } from "@/lib/auth/names";
import { isUserRole, type Profile } from "@/lib/auth/types";
import { logger } from "@/lib/logger";

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
  if (!isUserRole(row.role)) {
    return null;
  }

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

function namesFromMetadata(user: {
  user_metadata?: Record<string, unknown>;
}): { firstName: string | null; lastName: string | null } {
  const metadata = user.user_metadata ?? {};
  const fullName =
    typeof metadata.full_name === "string" ? metadata.full_name : "";
  const split = splitFullName(fullName);
  const firstName =
    typeof metadata.first_name === "string" && metadata.first_name.trim()
      ? metadata.first_name.trim()
      : split.firstName || null;
  const lastName =
    typeof metadata.last_name === "string" && metadata.last_name.trim()
      ? metadata.last_name.trim()
      : split.lastName;

  return { firstName, lastName };
}

async function fetchProfile(
  userId: string,
): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, user_id, role, first_name, last_name, phone, avatar_url, created_at, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toProfile(data as ProfileRow);
}

/**
 * Server-only recovery if auth.users exists but the signup trigger missed.
 * Never call this from the browser. Does not change an existing role.
 */
async function repairMissingProfile(userId: string, user: {
  user_metadata?: Record<string, unknown>;
}): Promise<Profile | null> {
  if (!isServerEnvConfigured()) {
    logger.warn("auth.profile_repair_skipped");
    return null;
  }

  try {
    const admin = createServiceRoleClient();
    const names = namesFromMetadata(user);
    const { error } = await admin.from("profiles").insert({
      user_id: userId,
      role: "customer",
      first_name: names.firstName,
      last_name: names.lastName,
    });

    if (error && !error.message.toLowerCase().includes("duplicate")) {
      logger.error("auth.profile_repair_failed");
      return null;
    }
  } catch {
    logger.error("auth.profile_repair_failed");
    return null;
  }

  return fetchProfile(userId);
}

async function syncProfileNames(profile: Profile, user: {
  user_metadata?: Record<string, unknown>;
}): Promise<Profile> {
  if (profile.firstName) {
    return profile;
  }

  const names = namesFromMetadata(user);
  if (!names.firstName) {
    return profile;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      first_name: names.firstName,
      last_name: names.lastName,
    })
    .eq("user_id", profile.userId)
    .select(
      "id, user_id, role, first_name, last_name, phone, avatar_url, created_at, updated_at",
    )
    .maybeSingle();

  if (error || !data) {
    return profile;
  }

  return toProfile(data as ProfileRow) ?? profile;
}

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  if (!isPublicSupabaseConfigured()) {
    return null;
  }

  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  let profile = await fetchProfile(user.id);
  if (!profile) {
    profile = await repairMissingProfile(user.id, user);
  }

  if (!profile) {
    return null;
  }

  return syncProfileNames(profile, user);
});
