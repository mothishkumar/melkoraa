import type { Request } from "express";

import { consumeRateLimit } from "@/lib/http/rate-limit";

import { sendError } from "./express-response.js";
import type { Response } from "express";

export function mutationRateLimitExpress(
  req: Request,
  res: Response,
  scope: string,
  userId: string,
  limit: number,
  windowMs = 60_000,
): boolean {
  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.headers["x-real-ip"]?.toString() ||
    req.ip ||
    "local";
  const result = consumeRateLimit(`${scope}:${ip}:${userId}`, limit, windowMs);
  if (!result.ok) {
    sendError(res, "RATE_LIMITED", "Too many requests. Try again shortly.", 429);
    return false;
  }
  return true;
}
