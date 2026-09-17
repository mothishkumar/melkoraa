import { Router } from "express";

import { AUTH_MESSAGES, fieldErrorsFromZod, mapAuthError } from "@/lib/auth/errors";
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
import { isPublicSupabaseConfigured } from "@/lib/env/public";
import { consumeRateLimit } from "@/lib/http/rate-limit";
import { logger } from "@/lib/logger";

import { asyncHandler, handleRoute } from "../lib/handle-route.js";
import { sendError, sendJson } from "../lib/express-response.js";
import { createExpressSupabaseClient } from "../lib/supabase.js";
import { loadAuthContext, requireAuth } from "../middleware/auth.js";

const RESEND_COOKIE = "melkoraa_verify_resend";
const RESEND_COOLDOWN_SECONDS = 60;

function frontendUrl() {
  return process.env.SITE_URL ?? "http://localhost:5173";
}

function apiCallbackUrl() {
  const port = process.env.PORT ?? "4318";
  return process.env.API_PUBLIC_URL ?? `http://localhost:${port}`;
}

function authThrottle(req: import("express").Request, bucket: string, identity: string, limit: number, windowMs: number) {
  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.headers["x-real-ip"]?.toString() ||
    req.ip ||
    "local";
  return consumeRateLimit(`${bucket}:${ip}:${identity.toLowerCase()}`, limit, windowMs);
}

export const authRouter = Router();

authRouter.get(
  "/me",
  requireAuth,
  (req, res) => {
    const { user, profile } = req.auth!;
    sendJson(res, {
      id: user.id,
      email: user.email,
      emailConfirmed: Boolean(user.email_confirmed_at),
      role: profile.role,
      firstName: profile.firstName,
      lastName: profile.lastName,
    });
  },
);

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    if (!isPublicSupabaseConfigured()) {
      return sendError(res, "CONFIG", AUTH_MESSAGES.supabaseMissing, 503);
    }

    await handleRoute(res, async () => {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return {
          status: 400,
          body: {
            error: {
              code: "VALIDATION_ERROR",
              message: "Check the highlighted fields.",
              details: fieldErrorsFromZod(parsed.error),
            },
          },
        };
      }

      const { fullName, email, password } = parsed.data;
      const throttled = authThrottle(req, "auth.register", email, 5, 15 * 60_000);
      if (!throttled.ok) {
        return { status: 429, body: { error: { code: "RATE_LIMITED", message: AUTH_MESSAGES.rateLimited } } };
      }

      const supabase = createExpressSupabaseClient(req, res);
      const { firstName, lastName } = splitFullName(fullName);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${apiCallbackUrl()}/api/v1/auth/callback?next=${encodeURIComponent("/account")}`,
          data: { full_name: fullName, first_name: firstName, last_name: lastName },
        },
      });

      if (error) {
        logger.warn("auth.register_failed");
        return {
          status: 400,
          body: { error: { code: "AUTH", message: mapAuthError(error, AUTH_MESSAGES.registerFailed) } },
        };
      }

      const identities = data.user?.identities;
      if (data.user && identities && identities.length === 0) {
        return { body: { data: { ok: true, needsVerification: true } } };
      }
      if (!data.session) {
        return { body: { data: { ok: true, needsVerification: true } } };
      }

      await loadAuthContext(req, res);
      const profile = req.auth?.profile;
      return {
        body: {
          data: {
            ok: true,
            redirectTo: profile ? defaultPostLoginPath(profile.role) : "/account",
          },
        },
      };
    });
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    if (!isPublicSupabaseConfigured()) {
      return sendError(res, "CONFIG", AUTH_MESSAGES.supabaseMissing, 503);
    }

    await handleRoute(res, async () => {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return {
          status: 400,
          body: {
            error: {
              code: "VALIDATION_ERROR",
              message: "Check the highlighted fields.",
              details: fieldErrorsFromZod(parsed.error),
            },
          },
        };
      }

      const throttled = authThrottle(req, "auth.login", parsed.data.email, 8, 60_000);
      if (!throttled.ok) {
        return { status: 429, body: { error: { code: "RATE_LIMITED", message: AUTH_MESSAGES.rateLimited } } };
      }

      const supabase = createExpressSupabaseClient(req, res);
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (error) {
        const message = mapAuthError(error, AUTH_MESSAGES.invalidLogin);
        return {
          status: 401,
          body: {
            error: {
              code: "AUTH",
              message,
              details: message === AUTH_MESSAGES.unverifiedEmail ? { needsVerification: "true" } : undefined,
            },
          },
        };
      }

      await loadAuthContext(req, res);
      const profile = req.auth?.profile;
      const redirectTo = resolvePostLoginPath(
        profile?.role ?? "customer",
        parsed.data.next,
        getSafeRedirectPath,
        AUTH_ROUTES.unauthorized,
      );
      return { body: { data: { ok: true, redirectTo } } };
    });
  }),
);

authRouter.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    const supabase = createExpressSupabaseClient(req, res);
    await supabase.auth.signOut();
    sendJson(res, { ok: true });
  }),
);

authRouter.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    if (!isPublicSupabaseConfigured()) {
      return sendError(res, "CONFIG", AUTH_MESSAGES.supabaseMissing, 503);
    }

    await handleRoute(res, async () => {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return {
          status: 400,
          body: {
            error: {
              code: "VALIDATION_ERROR",
              message: "Enter a valid email address.",
              details: fieldErrorsFromZod(parsed.error),
            },
          },
        };
      }

      const throttled = authThrottle(req, "auth.forgot", parsed.data.email, 5, 15 * 60_000);
      if (!throttled.ok) {
        return { status: 429, body: { error: { code: "RATE_LIMITED", message: AUTH_MESSAGES.rateLimited } } };
      }

      const supabase = createExpressSupabaseClient(req, res);
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${apiCallbackUrl()}/api/v1/auth/callback?next=${encodeURIComponent(AUTH_ROUTES.resetPassword)}`,
      });

      if (error && error.status === 429) {
        return { status: 429, body: { error: { code: "RATE_LIMITED", message: AUTH_MESSAGES.rateLimited } } };
      }

      return { body: { data: { ok: true } } };
    });
  }),
);

authRouter.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    if (!isPublicSupabaseConfigured()) {
      return sendError(res, "CONFIG", AUTH_MESSAGES.supabaseMissing, 503);
    }

    await handleRoute(res, async () => {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return {
          status: 400,
          body: {
            error: {
              code: "VALIDATION_ERROR",
              message: "Check the highlighted fields.",
              details: fieldErrorsFromZod(parsed.error),
            },
          },
        };
      }

      const supabase = createExpressSupabaseClient(req, res);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { status: 401, body: { error: { code: "AUTH", message: AUTH_MESSAGES.recoveryMissing } } };
      }

      const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
      if (error) {
        return {
          status: 400,
          body: { error: { code: "AUTH", message: mapAuthError(error, AUTH_MESSAGES.unexpected) } },
        };
      }

      await supabase.auth.signOut();
      return { body: { data: { ok: true, redirectTo: `${AUTH_ROUTES.login}?reset=1` } } };
    });
  }),
);

authRouter.post(
  "/resend-verification",
  asyncHandler(async (req, res) => {
    if (!isPublicSupabaseConfigured()) {
      return sendError(res, "CONFIG", AUTH_MESSAGES.supabaseMissing, 503);
    }

    await handleRoute(res, async () => {
      const parsed = resendVerificationSchema.safeParse(req.body);
      if (!parsed.success) {
        return {
          status: 400,
          body: {
            error: {
              code: "VALIDATION_ERROR",
              message: "Enter a valid email address.",
              details: fieldErrorsFromZod(parsed.error),
            },
          },
        };
      }

      const last = req.cookies?.[RESEND_COOKIE];
      if (last) {
        const elapsed = Date.now() - Number(last);
        if (Number.isFinite(elapsed) && elapsed < RESEND_COOLDOWN_SECONDS * 1000) {
          return { status: 429, body: { error: { code: "COOLDOWN", message: AUTH_MESSAGES.cooldown } } };
        }
      }

      const supabase = createExpressSupabaseClient(req, res);
      const { data: { user } } = await supabase.auth.getUser();
      const sessionEmail = user?.email?.trim().toLowerCase();
      if (user?.email_confirmed_at && sessionEmail === parsed.data.email.trim().toLowerCase()) {
        return {
          status: 400,
          body: { error: { code: "ALREADY_VERIFIED", message: AUTH_MESSAGES.alreadyVerified } },
        };
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: parsed.data.email,
        options: {
          emailRedirectTo: `${apiCallbackUrl()}/api/v1/auth/callback?next=${encodeURIComponent("/account")}`,
        },
      });

      res.cookie(RESEND_COOKIE, String(Date.now()), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: RESEND_COOLDOWN_SECONDS * 1000,
      });

      if (error && error.status === 429) {
        return { status: 429, body: { error: { code: "RATE_LIMITED", message: AUTH_MESSAGES.rateLimited } } };
      }

      return { body: { data: { ok: true } } };
    });
  }),
);

authRouter.get(
  "/callback",
  asyncHandler(async (req, res) => {
    const code = typeof req.query.code === "string" ? req.query.code : null;
    const next = getSafeRedirectPath(
      typeof req.query.next === "string" ? req.query.next : null,
      "/account",
    );

    if (!isPublicSupabaseConfigured()) {
      return res.redirect(`${frontendUrl()}${AUTH_ROUTES.login}`);
    }

    if (code) {
      const supabase = createExpressSupabaseClient(req, res);
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return res.redirect(`${frontendUrl()}${next}`);
      }
      logger.warn("auth.callback_failed");
    }

    return res.redirect(`${frontendUrl()}${AUTH_ROUTES.login}?error=auth`);
  }),
);
