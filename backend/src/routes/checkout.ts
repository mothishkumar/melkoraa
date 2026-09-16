import { Router } from "express";

import { consumeRateLimit } from "@/lib/http/rate-limit";
import { checkoutBodySchema } from "@/lib/validation/checkout";
import { checkout } from "@/server/services/checkout/checkout-service";

import { asyncHandler, handleRoute } from "../lib/handle-route.js";
import { sendError, sendJson } from "../lib/express-response.js";
import { requireAuth } from "../middleware/auth.js";

export const checkoutRouter = Router();

checkoutRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.auth!.user.id;
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.headers["x-real-ip"]?.toString() ||
      req.ip ||
      "local";
    const limited = consumeRateLimit(`checkout:${ip}:${userId}`, 8, 60_000);
    if (!limited.ok) {
      return sendError(res, "RATE_LIMITED", "Too many requests. Try again shortly.", 429);
    }

    await handleRoute(res, async () => {
      const body = checkoutBodySchema.parse(req.body);
      const session = await checkout(userId, body);
      sendJson(res, session, 201);
    });
  }),
);
