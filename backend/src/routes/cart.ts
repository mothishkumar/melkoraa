import { Router } from "express";

import { addCartItemSchema, updateCartItemSchema } from "@/lib/validation/cart";
import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from "@/server/services/cart/cart-service";

import { asyncHandler, handleRoute } from "../lib/handle-route.js";
import { sendJson } from "../lib/express-response.js";
import { param } from "../lib/params.js";
import { requireAuth } from "../middleware/auth.js";

export const cartRouter = Router();

cartRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      sendJson(res, await getCart(req.auth!.user.id));
    });
  }),
);

cartRouter.delete(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      sendJson(res, await clearCart(req.auth!.user.id));
    });
  }),
);

cartRouter.post(
  "/items",
  requireAuth,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const body = addCartItemSchema.parse(req.body);
      sendJson(res, await addCartItem(req.auth!.user.id, body.variantId, body.quantity));
    });
  }),
);

cartRouter.patch(
  "/items/:variantId",
  requireAuth,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const body = updateCartItemSchema.parse(req.body);
      sendJson(res, await updateCartItem(req.auth!.user.id, param(req.params.variantId), body.quantity));
    });
  }),
);

cartRouter.delete(
  "/items/:variantId",
  requireAuth,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      sendJson(res, await removeCartItem(req.auth!.user.id, param(req.params.variantId)));
    });
  }),
);
