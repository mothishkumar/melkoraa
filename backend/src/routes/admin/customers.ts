import { Router } from "express";

import { adminCustomerQuerySchema } from "@/lib/validation/admin";
import { listAdminCustomers } from "@/server/services/customers/customer-service";

import { asyncHandler, handleRoute } from "../../lib/handle-route.js";
import { sendPage } from "../../lib/express-response.js";
import { searchParamsRecord as expressQuery } from "../../lib/query.js";
import { requireStaff } from "../../middleware/admin-guard.js";

export const adminCustomersRouter = Router();

adminCustomersRouter.get(
  "/",
  requireStaff,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const query = adminCustomerQuerySchema.parse(expressQuery(req.query as Record<string, unknown>));
      const result = await listAdminCustomers(query);
      sendPage(res, result.data, result.pagination);
    });
  }),
);
