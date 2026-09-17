import { Router } from "express";

import { publicListQuerySchema } from "@/lib/validation/catalog";
import { listPublicCollections } from "@/server/services/catalog/collection-service";

import { asyncHandler, handleRoute } from "../lib/handle-route.js";
import { sendPage } from "../lib/express-response.js";

export const collectionsRouter = Router();

collectionsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const query = publicListQuerySchema.parse({
        page: req.query.page,
        pageSize: req.query.pageSize,
      });
      const result = await listPublicCollections(query.page, query.pageSize);
      sendPage(res, result.data, result.pagination);
    });
  }),
);
