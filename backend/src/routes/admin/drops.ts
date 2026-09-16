import { Router } from "express";

import {
  createDropSchema,
  dropProductSchema,
  publicListQuerySchema,
  updateDropSchema,
  uuidSchema,
} from "@/lib/validation/catalog";
import {
  archiveDrop,
  associateDropProduct,
  createDrop,
  dissociateDropProduct,
  getAdminDrop,
  listAdminDrops,
  updateDrop,
} from "@/server/services/catalog/drop-service";

import { asyncHandler, handleRoute } from "../../lib/handle-route.js";
import { sendJson, sendPage } from "../../lib/express-response.js";
import { searchParamsRecord as expressQuery } from "../../lib/query.js";
import { requireManager, requireStaff } from "../../middleware/admin-guard.js";
import { param } from "../../lib/params.js";

export const adminDropsRouter = Router();

adminDropsRouter.get(
  "/",
  requireStaff,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const query = publicListQuerySchema.parse(expressQuery(req.query as Record<string, unknown>));
      const result = await listAdminDrops(query.page, query.pageSize);
      sendPage(res, result.data, result.pagination);
    });
  }),
);

adminDropsRouter.post(
  "/",
  requireManager,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const body = createDropSchema.parse(req.body);
      const drop = await createDrop(body, req.auth!.user.id);
      sendJson(res, drop, 201);
    });
  }),
);

const dropRouter = Router({ mergeParams: true });

dropRouter.get(
  "/",
  requireStaff,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const id = uuidSchema.parse(param(req.params.id));
      const drop = await getAdminDrop(id);
      sendJson(res, drop);
    });
  }),
);

dropRouter.patch(
  "/",
  requireManager,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const id = uuidSchema.parse(param(req.params.id));
      const body = updateDropSchema.parse(req.body);
      const drop = await updateDrop(id, body, req.auth!.user.id);
      sendJson(res, drop);
    });
  }),
);

dropRouter.delete(
  "/",
  requireManager,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const id = uuidSchema.parse(param(req.params.id));
      const drop = await archiveDrop(id, req.auth!.user.id);
      sendJson(res, drop);
    });
  }),
);

dropRouter.post(
  "/products",
  requireManager,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const id = uuidSchema.parse(param(req.params.id));
      const body = dropProductSchema.parse(req.body);
      const drop = await associateDropProduct(id, body.productId, body.displayOrder, req.auth!.user.id);
      sendJson(res, drop, 201);
    });
  }),
);

dropRouter.delete(
  "/products/:productId",
  requireManager,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const id = uuidSchema.parse(param(req.params.id));
      const productId = uuidSchema.parse(param(req.params.productId));
      await dissociateDropProduct(id, productId, req.auth!.user.id);
      res.status(204).end();
    });
  }),
);

adminDropsRouter.use("/:id", dropRouter);
