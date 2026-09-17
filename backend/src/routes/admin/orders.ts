import { Router } from "express";

import { orderListQuerySchema, uuidSchema } from "@/lib/validation/checkout";
import { getAdminOrder, listAdminOrders } from "@/server/services/orders/order-service";

import { asyncHandler, handleRoute } from "../../lib/handle-route.js";
import { sendJson, sendPage } from "../../lib/express-response.js";
import { searchParamsRecord as expressQuery } from "../../lib/query.js";
import { requireStaff } from "../../middleware/admin-guard.js";
import { param } from "../../lib/params.js";

export const adminOrdersRouter = Router();

adminOrdersRouter.get(
  "/",
  requireStaff,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const query = orderListQuerySchema.parse(expressQuery(req.query as Record<string, unknown>));
      const result = await listAdminOrders(query.page, query.pageSize, {
        status: query.status,
        paymentStatus: query.paymentStatus,
        search: query.search,
        sort: query.sort,
      });
      sendPage(res, result.data, result.pagination);
    });
  }),
);

adminOrdersRouter.get(
  "/:id",
  requireStaff,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const id = uuidSchema.parse(param(req.params.id));
      const order = await getAdminOrder(id);
      sendJson(res, order);
    });
  }),
);
