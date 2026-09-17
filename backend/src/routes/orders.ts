import { Router } from "express";

import { uuidSchema } from "@/lib/validation/checkout";
import { cancelCustomerOrder, getCustomerOrder } from "@/server/services/orders/order-service";

import { asyncHandler, handleRoute } from "../lib/handle-route.js";
import { sendJson } from "../lib/express-response.js";
import { param } from "../lib/params.js";
import { requireAuth } from "../middleware/auth.js";

export const ordersRouter = Router();

ordersRouter.get(
  "/:orderId",
  requireAuth,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const orderId = param(req.params.orderId);
      uuidSchema.parse(orderId);
      const order = await getCustomerOrder(req.auth!.user.id, orderId);
      sendJson(res, order);
    });
  }),
);

ordersRouter.post(
  "/:orderId/cancel",
  requireAuth,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const orderId = param(req.params.orderId);
      uuidSchema.parse(orderId);
      const order = await cancelCustomerOrder(req.auth!.user.id, orderId);
      sendJson(res, order);
    });
  }),
);
