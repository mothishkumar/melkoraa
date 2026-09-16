import type { NextFunction, Request, Response } from "express";

import { sendError } from "../lib/express-response.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function trustedOrigins() {
  return new Set(
    [
      process.env.CORS_ORIGIN ?? "http://localhost:5173",
      process.env.ADMIN_CORS_ORIGIN ?? "http://localhost:5174",
    ].map((origin) => origin.replace(/\/$/, "")),
  );
}

/**
 * Require an explicit, configured browser origin for state-changing admin
 * requests. This complements the httpOnly SameSite session cookies and is
 * intentionally not used for the public Razorpay webhook route.
 */
export function requireTrustedOrigin(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const origin = req.get("origin")?.replace(/\/$/, "");
  if (!origin || !trustedOrigins().has(origin)) {
    sendError(res, "CSRF_ORIGIN", "This request origin is not allowed.", 403);
    return;
  }

  next();
}
