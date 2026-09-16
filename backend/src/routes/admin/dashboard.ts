import { Router } from "express";

import { getAdminDashboard } from "@/server/services/admin/dashboard-service";

import { asyncHandler, handleRoute } from "../../lib/handle-route.js";
import { sendJson } from "../../lib/express-response.js";
import { requireStaff } from "../../middleware/admin-guard.js";

export const adminDashboardRouter = Router();

adminDashboardRouter.get(
  "/",
  requireStaff,
  asyncHandler(async (_req, res) => {
    await handleRoute(res, async () => {
      sendJson(res, await getAdminDashboard());
    });
  }),
);
