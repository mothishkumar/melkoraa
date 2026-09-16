import { Router } from "express";

import {
  adminCategoryQuerySchema,
  createCategorySchema,
  updateCategorySchema,
  uuidSchema,
} from "@/lib/validation/catalog";
import {
  createCategory,
  deleteCategory,
  listAdminCategories,
  updateCategory,
} from "@/server/services/catalog/category-service";

import { asyncHandler, handleRoute } from "../../lib/handle-route.js";
import { sendJson, sendPage } from "../../lib/express-response.js";
import { searchParamsRecord as expressQuery } from "../../lib/query.js";
import { requireAdminRole, requireManager, requireStaff } from "../../middleware/admin-guard.js";
import { param } from "../../lib/params.js";

export const adminCategoriesRouter = Router();

adminCategoriesRouter.get(
  "/",
  requireStaff,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const query = adminCategoryQuerySchema.parse(expressQuery(req.query as Record<string, unknown>));
      const result = await listAdminCategories(query);
      sendPage(res, result.data, result.pagination);
    });
  }),
);

adminCategoriesRouter.post(
  "/",
  requireManager,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const body = createCategorySchema.parse(req.body);
      const category = await createCategory(body, req.auth!.user.id);
      sendJson(res, category, 201);
    });
  }),
);

adminCategoriesRouter.patch(
  "/:id",
  requireManager,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const id = uuidSchema.parse(param(req.params.id));
      const body = updateCategorySchema.parse(req.body);
      const category = await updateCategory(id, body, req.auth!.user.id);
      sendJson(res, category);
    });
  }),
);

adminCategoriesRouter.delete(
  "/:id",
  requireAdminRole,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const id = uuidSchema.parse(param(req.params.id));
      await deleteCategory(id, req.auth!.user.id);
      res.status(204).end();
    });
  }),
);
