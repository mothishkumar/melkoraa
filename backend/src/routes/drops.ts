import { Router } from "express";

import { getPublicDropBySlug } from "@/server/services/catalog/drop-service";

import { asyncHandler, handleRoute } from "../lib/handle-route.js";
import { sendJson } from "../lib/express-response.js";
import { param } from "../lib/params.js";

export const dropsRouter = Router();

dropsRouter.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const drop = await getPublicDropBySlug(param(req.params.slug));
      sendJson(res, drop);
    });
  }),
);
