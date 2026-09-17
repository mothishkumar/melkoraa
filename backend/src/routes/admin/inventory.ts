import { Router } from "express";

import {
  adjustInventorySchema,
  initializeInventorySchema,
  inventoryListQuerySchema,
  stockMutationSchema,
  uuidSchema,
} from "@/lib/validation/inventory";
import {
  adjustInventory,
  confirmInventorySale,
  getAdminInventory,
  initializeInventory,
  listAdminInventory,
  releaseInventory,
  reserveInventory,
} from "@/server/services/inventory/inventory-service";

import { asyncHandler, handleRoute } from "../../lib/handle-route.js";
import { sendJson, sendPage } from "../../lib/express-response.js";
import { searchParamsRecord as expressQuery } from "../../lib/query.js";
import { mutationRateLimitExpress } from "../../lib/rate-limit-express.js";
import { requireManager, requireStaff } from "../../middleware/admin-guard.js";
import { param } from "../../lib/params.js";

export const adminInventoryRouter = Router();

adminInventoryRouter.get(
  "/",
  requireStaff,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const query = inventoryListQuerySchema.parse(expressQuery(req.query as Record<string, unknown>));
      const result = await listAdminInventory(query);
      sendPage(res, result.data, result.pagination);
    });
  }),
);

adminInventoryRouter.post(
  "/",
  requireManager,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const body = initializeInventorySchema.parse(req.body);
      const inventory = await initializeInventory(body, req.auth!.user.id);
      sendJson(res, inventory, 201);
    });
  }),
);

const variantRouter = Router({ mergeParams: true });

variantRouter.get(
  "/",
  requireStaff,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const variantId = uuidSchema.parse(param(req.params.variantId));
      const inventory = await getAdminInventory(variantId);
      sendJson(res, inventory);
    });
  }),
);

variantRouter.post(
  "/adjust",
  requireManager,
  asyncHandler(async (req, res) => {
    if (!req.auth?.user) return;
    if (!mutationRateLimitExpress(req, res, "admin.inventory.adjust", req.auth.user.id, 30)) return;
    await handleRoute(res, async () => {
      const variantId = uuidSchema.parse(param(req.params.variantId));
      const body = adjustInventorySchema.parse(req.body);
      const inventory = await adjustInventory(variantId, body.delta, {
        actorId: req.auth!.user.id,
        notes: body.notes,
        referenceType: body.referenceType,
        referenceId: body.referenceId,
      });
      sendJson(res, inventory);
    });
  }),
);

variantRouter.post(
  "/reserve",
  requireManager,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const variantId = uuidSchema.parse(param(req.params.variantId));
      const body = stockMutationSchema.parse(req.body);
      const inventory = await reserveInventory(variantId, body.quantity, {
        actorId: req.auth!.user.id,
        notes: body.notes,
        referenceType: body.referenceType,
        referenceId: body.referenceId,
      });
      sendJson(res, inventory);
    });
  }),
);

variantRouter.post(
  "/confirm",
  requireManager,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const variantId = uuidSchema.parse(param(req.params.variantId));
      const body = stockMutationSchema.parse(req.body);
      const inventory = await confirmInventorySale(variantId, body.quantity, {
        actorId: req.auth!.user.id,
        notes: body.notes,
        referenceType: body.referenceType,
        referenceId: body.referenceId,
      });
      sendJson(res, inventory);
    });
  }),
);

variantRouter.post(
  "/release",
  requireManager,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const variantId = uuidSchema.parse(param(req.params.variantId));
      const body = stockMutationSchema.parse(req.body);
      const inventory = await releaseInventory(variantId, body.quantity, {
        actorId: req.auth!.user.id,
        notes: body.notes,
        referenceType: body.referenceType,
        referenceId: body.referenceId,
      });
      sendJson(res, inventory);
    });
  }),
);

adminInventoryRouter.use("/:variantId", variantRouter);
