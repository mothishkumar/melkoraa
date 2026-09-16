import { Router } from "express";

import { consumeRateLimit } from "@/lib/http/rate-limit";
import { verifyPaymentBodySchema } from "@/lib/validation/payments";
import { verifyCustomerCheckoutPayment } from "@/server/services/payments/payment-service";

import { asyncHandler, handleRoute } from "../lib/handle-route.js";
import { sendError, sendJson } from "../lib/express-response.js";
import { requireAuth } from "../middleware/auth.js";

export const paymentsRouter = Router();

paymentsRouter.post(
  "/verify",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.auth!.user.id;
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.headers["x-real-ip"]?.toString() ||
      req.ip ||
      "local";
    const limited = consumeRateLimit(`payments.verify:${ip}:${userId}`, 20, 60_000);
    if (!limited.ok) {
      return sendError(res, "RATE_LIMITED", "Too many requests. Try again shortly.", 429);
    }

    await handleRoute(res, async () => {
      const body = verifyPaymentBodySchema.parse(req.body);
      const result = await verifyCustomerCheckoutPayment(userId, body);
      sendJson(res, {
        order: result.order,
        payment: result.payment,
        alreadyFinalized: result.alreadyFinalized,
      });
    });
  }),
);
