import { Router } from "express";

import { sendError } from "../../lib/express-response.js";
import { requireStaff } from "../../middleware/admin-guard.js";

export const adminCouponsRouter = Router();

adminCouponsRouter.get("/", requireStaff, (_req, res) => {
  sendError(res, "NOT_IMPLEMENTED", "Admin coupons is not implemented in this phase.", 501);
});
