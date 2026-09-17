import type { NextFunction, Request, Response } from "express";

import { allTrustedOrigins } from "../lib/cors-origins.js";
import { sendError } from "../lib/express-response.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function trustedOrigins() {
  return new Set(allTrustedOrigins());
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
