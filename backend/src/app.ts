import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { adminRouter } from "./routes/admin/index.js";
import { addressesRouter } from "./routes/addresses.js";
import { authRouter } from "./routes/auth.js";
import { cartRouter } from "./routes/cart.js";
import { categoriesRouter } from "./routes/categories.js";
import { checkoutRouter } from "./routes/checkout.js";
import { collectionsRouter } from "./routes/collections.js";
import { dropsRouter } from "./routes/drops.js";
import { healthRouter } from "./routes/health.js";
import { ordersRouter } from "./routes/orders.js";
import { paymentsRouter } from "./routes/payments.js";
import { productsRouter } from "./routes/products.js";
import { webhooksRouter } from "./routes/webhooks.js";
import { authMiddleware } from "./middleware/auth.js";
import { requireServerEnv } from "./middleware/require-server-env.js";

export function createApp() {
  const app = express();
  const corsOrigins = [
    process.env.CORS_ORIGIN ?? "http://localhost:5173",
    process.env.ADMIN_CORS_ORIGIN ?? "http://localhost:5174",
  ];

  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    }),
  );

  app.use("/api/v1/webhooks", webhooksRouter);

  app.use(express.json());
  app.use(cookieParser());
  app.use(authMiddleware);

  const api = express.Router();
  api.use("/health", healthRouter);
  api.use("/auth", authRouter);
  api.use("/products", requireServerEnv, productsRouter);
  api.use("/categories", requireServerEnv, categoriesRouter);
  api.use("/collections", requireServerEnv, collectionsRouter);
  api.use("/drops", requireServerEnv, dropsRouter);
  api.use("/cart", requireServerEnv, cartRouter);
  api.use("/addresses", requireServerEnv, addressesRouter);
  api.use("/checkout", requireServerEnv, checkoutRouter);
  api.use("/payments", requireServerEnv, paymentsRouter);
  api.use("/orders", requireServerEnv, ordersRouter);
  api.use("/admin", adminRouter);

  app.use("/api/v1", api);

  app.get("/", (_req, res) => {
    res.json({ service: "melkoraa-api", version: "v1" });
  });

  return app;
}
