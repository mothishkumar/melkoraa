import { Router } from "express";

import { publicListQuerySchema } from "@/lib/validation/catalog";
import { listPublicCategories } from "@/server/services/catalog/category-service";

import { asyncHandler, handleRoute } from "../lib/handle-route.js";
import { sendPage } from "../lib/express-response.js";

export const categoriesRouter = Router();

categoriesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const query = publicListQuerySchema.parse({
        page: req.query.page,
        pageSize: req.query.pageSize,
      });
      const result = await listPublicCategories(query.page, query.pageSize);
      sendPage(res, result.data, result.pagination);
    });
  }),
);
