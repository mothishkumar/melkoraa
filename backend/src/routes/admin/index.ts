import { Router } from "express";

import { adminAuditLogsRouter } from "./audit-logs.js";
import { adminCategoriesRouter } from "./categories.js";
import { adminCollectionsRouter } from "./collections.js";
import { adminCouponsRouter } from "./coupons.js";
import { adminCustomersRouter } from "./customers.js";
import { adminDashboardRouter } from "./dashboard.js";
import { adminDropsRouter } from "./drops.js";
import { adminInventoryRouter } from "./inventory.js";
import { adminOrdersRouter } from "./orders.js";
import { adminPaymentsRouter } from "./payments.js";
import { adminProductsRouter } from "./products.js";
import { requireStaff } from "../../middleware/admin-guard.js";
import { requireServerEnv } from "../../middleware/require-server-env.js";
import { requireTrustedOrigin } from "../../middleware/trusted-origin.js";

export const adminRouter = Router();

// Authenticate before checking the request origin so anonymous callers
// consistently receive 401 and customers consistently receive 403.
adminRouter.use(requireStaff, requireTrustedOrigin, requireServerEnv);

adminRouter.use("/dashboard", adminDashboardRouter);
adminRouter.use("/products", adminProductsRouter);
adminRouter.use("/inventory", adminInventoryRouter);
adminRouter.use("/orders", adminOrdersRouter);
adminRouter.use("/payments", adminPaymentsRouter);
adminRouter.use("/customers", adminCustomersRouter);
adminRouter.use("/drops", adminDropsRouter);
adminRouter.use("/collections", adminCollectionsRouter);
adminRouter.use("/categories", adminCategoriesRouter);
adminRouter.use("/audit-logs", adminAuditLogsRouter);
adminRouter.use("/coupons", adminCouponsRouter);
