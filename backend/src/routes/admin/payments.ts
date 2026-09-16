import { Router } from "express";

import { adminPaymentQuerySchema } from "@/lib/validation/admin";
import { listAdminPayments } from "@/server/services/payments/admin-payment-service";

import { asyncHandler, handleRoute } from "../../lib/handle-route.js";
import { sendPage } from "../../lib/express-response.js";
import { searchParamsRecord as expressQuery } from "../../lib/query.js";
import { requireStaff } from "../../middleware/admin-guard.js";

export const adminPaymentsRouter = Router();

adminPaymentsRouter.get(
  "/",
  requireStaff,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const query = adminPaymentQuerySchema.parse(expressQuery(req.query as Record<string, unknown>));
      const result = await listAdminPayments(query);
      sendPage(res, result.data, result.pagination);
    });
  }),
);
