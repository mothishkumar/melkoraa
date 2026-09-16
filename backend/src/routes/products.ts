import { Router } from "express";

import { parsePublicProductQuery } from "@/lib/validation/catalog";
import { listPublicProducts, getPublicProductBySlug } from "@/server/services/catalog/product-service";

import { asyncHandler, handleRoute } from "../lib/handle-route.js";
import { sendJson, sendPage } from "../lib/express-response.js";
import { param } from "../lib/params.js";

export const productsRouter = Router();

productsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const query = parsePublicProductQuery(req.query as Record<string, string | undefined>);
      const result = await listPublicProducts(query);
      sendPage(res, result.data, result.pagination);
    });
  }),
);

productsRouter.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const product = await getPublicProductBySlug(param(req.params.slug));
      sendJson(res, product);
    });
  }),
);
