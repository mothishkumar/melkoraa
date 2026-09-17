import { Router } from "express";

import { adminAuditQuerySchema } from "@/lib/validation/admin";
import { listAdminAuditLogs } from "@/server/services/admin/audit-service";

import { asyncHandler, handleRoute } from "../../lib/handle-route.js";
import { sendPage } from "../../lib/express-response.js";
import { searchParamsRecord as expressQuery } from "../../lib/query.js";
import { requireManager } from "../../middleware/admin-guard.js";

export const adminAuditLogsRouter = Router();

adminAuditLogsRouter.get(
  "/",
  requireManager,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const query = adminAuditQuerySchema.parse(expressQuery(req.query as Record<string, unknown>));
      const result = await listAdminAuditLogs(query);
      sendPage(res, result.data, result.pagination);
    });
  }),
);
