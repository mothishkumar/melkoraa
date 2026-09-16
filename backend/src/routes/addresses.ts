import { Router } from "express";

import { addressBodySchema } from "@/lib/validation/addresses";
import { createCustomerAddress, listCustomerAddresses } from "@/server/services/addresses/address-service";

import { asyncHandler, handleRoute } from "../lib/handle-route.js";
import { sendJson } from "../lib/express-response.js";
import { requireAuth } from "../middleware/auth.js";

export const addressesRouter = Router();

addressesRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      sendJson(res, await listCustomerAddresses(req.auth!.user.id));
    });
  }),
);

addressesRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const body = addressBodySchema.parse(req.body);
      const address = await createCustomerAddress(req.auth!.user.id, {
        name: body.name,
        phone: body.phone,
        addressLine1: body.addressLine1,
        addressLine2: body.addressLine2 || undefined,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        country: body.country,
        isDefault: body.isDefault,
      });
      sendJson(res, address, 201);
    });
  }),
);
