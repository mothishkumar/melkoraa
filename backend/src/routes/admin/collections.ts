import { Router } from "express";

import {
  createCollectionSchema,
  publicListQuerySchema,
  updateCollectionSchema,
  uuidSchema,
} from "@/lib/validation/catalog";
import {
  archiveCollection,
  createCollection,
  listAdminCollections,
  updateCollection,
} from "@/server/services/catalog/collection-service";

import { asyncHandler, handleRoute } from "../../lib/handle-route.js";
import { sendJson, sendPage } from "../../lib/express-response.js";
import { searchParamsRecord as expressQuery } from "../../lib/query.js";
import { requireManager, requireStaff } from "../../middleware/admin-guard.js";
import { param } from "../../lib/params.js";

export const adminCollectionsRouter = Router();

adminCollectionsRouter.get(
  "/",
  requireStaff,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const query = publicListQuerySchema.parse(expressQuery(req.query as Record<string, unknown>));
      const result = await listAdminCollections(query.page, query.pageSize);
      sendPage(res, result.data, result.pagination);
    });
  }),
);

adminCollectionsRouter.post(
  "/",
  requireManager,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const body = createCollectionSchema.parse(req.body);
      const collection = await createCollection(body, req.auth!.user.id);
      sendJson(res, collection, 201);
    });
  }),
);

adminCollectionsRouter.patch(
  "/:id",
  requireManager,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const id = uuidSchema.parse(param(req.params.id));
      const body = updateCollectionSchema.parse(req.body);
      const collection = await updateCollection(id, body, req.auth!.user.id);
      sendJson(res, collection);
    });
  }),
);

adminCollectionsRouter.delete(
  "/:id",
  requireManager,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const id = uuidSchema.parse(param(req.params.id));
      const collection = await archiveCollection(id, req.auth!.user.id);
      sendJson(res, collection);
    });
  }),
);
