"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_MESSAGES, fieldErrorsFromZod, mapAuthError } from "@/lib/auth/errors";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { splitFullName } from "@/lib/auth/names";
import { defaultPostLoginPath, resolvePostLoginPath } from "@/lib/auth/permissions";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
} from "@/lib/auth/schemas";
import { getSiteUrl } from "@/lib/auth/site-url";
import { isPublicSupabaseConfigured } from "@/lib/env/public";
import { consumeRateLimit } from "@/lib/http/rate-limit";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AuthActionResult =
  | { ok: true; redirectTo?: string; needsVerification?: boolean }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string>;
      needsVerification?: boolean;
      alreadyVerified?: boolean;
    };

const RESEND_COOKIE = "melkoraa_verify_resend";
const RESEND_COOLDOWN_SECONDS = 60;

function configuredOrFail(): AuthActionResult | null {
  if (!isPublicSupabaseConfigured()) {
    return { ok: false, message: AUTH_MESSAGES.supabaseMissing };
  }
  return null;
}

function resolveLoginDestination(
  role: "customer" | "staff" | "manager" | "admin",
  next?: string,
) {
  return resolvePostLoginPath(role, next, getSafeRedirectPath, AUTH_ROUTES.unauthorized);
}

async function authThrottle(
  bucket: string,
  identity: string,
  limit: number,
  windowMs: number,
): Promise<AuthActionResult | null> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "local";
  const result = consumeRateLimit(`${bucket}:${ip}:${identity.toLowerCase()}`, limit, windowMs);
  if (!result.ok) {
    return { ok: false, message: AUTH_MESSAGES.rateLimited };
  }
  return null;
}

export async function registerAction(input: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<AuthActionResult> {
  const missing = configuredOrFail();
  if (missing) return missing;

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const { fullName, email, password } = parsed.data;
  const throttled = await authThrottle("auth.register", email, 5, 15 * 60_000);
  if (throttled) return throttled;
  const { firstName, lastName } = splitFullName(fullName);
  const supabase = await createServerSupabaseClient();
  const siteUrl = getSiteUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}${AUTH_ROUTES.callback}?next=${encodeURIComponent("/account")}`,
      data: {
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (error) {
    logger.warn("auth.register_failed");
    return { ok: false, message: mapAuthError(error, AUTH_MESSAGES.registerFailed) };
  }

  const identities = data.user?.identities;
  if (data.user && identities && identities.length === 0) {
    return { ok: true, needsVerification: true };
  }

  if (!data.session) {
    return { ok: true, needsVerification: true };
  }

  revalidatePath("/", "layout");
  const profile = await getCurrentProfile();
  return {
    ok: true,
    redirectTo: profile ? defaultPostLoginPath(profile.role) : "/account",
  };
}

export async function loginAction(input: {
  email: string;
  password: string;
  next?: string;
}): Promise<AuthActionResult> {
  const missing = configuredOrFail();
  if (missing) return missing;

  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const throttled = await authThrottle("auth.login", parsed.data.email, 8, 60_000);
  if (throttled) return throttled;

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    const message = mapAuthError(error, AUTH_MESSAGES.invalidLogin);
    return {
      ok: false,
      message,
      needsVerification: message === AUTH_MESSAGES.unverifiedEmail,
    };
  }

  revalidatePath("/", "layout");
  const profile = await getCurrentProfile();
  const redirectTo = resolveLoginDestination(
    profile?.role ?? "customer",
    parsed.data.next,
  );
  return { ok: true, redirectTo };
}

export async function logoutAction() {
  if (isPublicSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function forgotPasswordAction(input: {
  email: string;
}): Promise<AuthActionResult> {
  const missing = configuredOrFail();
  if (missing) return missing;

  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Enter a valid email address.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const throttled = await authThrottle("auth.forgot", parsed.data.email, 5, 15 * 60_000);
  if (throttled) return throttled;

  const supabase = await createServerSupabaseClient();
  const siteUrl = getSiteUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}${AUTH_ROUTES.callback}?next=${encodeURIComponent(AUTH_ROUTES.resetPassword)}`,
  });

  if (error && error.status === 429) {
    return { ok: false, message: AUTH_MESSAGES.rateLimited };
  }

  return { ok: true };
}

export async function resetPasswordAction(input: {
  password: string;
  confirmPassword: string;
}): Promise<AuthActionResult> {
  const missing = configuredOrFail();
  if (missing) return missing;

  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: AUTH_MESSAGES.recoveryMissing };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, message: mapAuthError(error, AUTH_MESSAGES.unexpected) };
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  return { ok: true, redirectTo: `${AUTH_ROUTES.login}?reset=1` };
}

export async function resendVerificationAction(input: {
  email: string;
}): Promise<AuthActionResult> {
  const missing = configuredOrFail();
  if (missing) return missing;

  const parsed = resendVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Enter a valid email address.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const cookieStore = await cookies();
  const last = cookieStore.get(RESEND_COOKIE)?.value;
  if (last) {
    const elapsed = Date.now() - Number(last);
    if (Number.isFinite(elapsed) && elapsed < RESEND_COOLDOWN_SECONDS * 1000) {
      return { ok: false, message: AUTH_MESSAGES.cooldown };
    }
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const sessionEmail = user?.email?.trim().toLowerCase();
  if (user?.email_confirmed_at && sessionEmail === parsed.data.email.trim().toLowerCase()) {
    return {
      ok: false,
      alreadyVerified: true,
      message: AUTH_MESSAGES.alreadyVerified,
    };
  }

  const siteUrl = getSiteUrl();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${siteUrl}${AUTH_ROUTES.callback}?next=${encodeURIComponent("/account")}`,
    },
  });

  cookieStore.set(RESEND_COOKIE, String(Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: AUTH_ROUTES.verifyEmail,
    maxAge: RESEND_COOLDOWN_SECONDS,
  });

  if (error && error.status === 429) {
    return { ok: false, message: AUTH_MESSAGES.rateLimited };
  }

  if (error) {
    const message = mapAuthError(error, AUTH_MESSAGES.verifySent);
    if (message === AUTH_MESSAGES.alreadyVerified) {
      return { ok: false, alreadyVerified: true, message };
    }
    if (message !== AUTH_MESSAGES.verifySent) {
      return { ok: false, message };
    }
  }

  return { ok: true };
}
