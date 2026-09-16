import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { addressesRouter } from "./routes/addresses.js";
import { authRouter } from "./routes/auth.js";
import { cartRouter } from "./routes/cart.js";
import { checkoutRouter } from "./routes/checkout.js";
import { dropsRouter } from "./routes/drops.js";
import { healthRouter } from "./routes/health.js";
import { ordersRouter } from "./routes/orders.js";
import { paymentsRouter } from "./routes/payments.js";
import { productsRouter } from "./routes/products.js";
import { webhooksRouter } from "./routes/webhooks.js";
import { authMiddleware } from "./middleware/auth.js";

export function createApp() {
  const app = express();
  const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

  app.use(
    cors({
      origin: corsOrigin,
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
  api.use("/products", productsRouter);
  api.use("/drops", dropsRouter);
  api.use("/cart", cartRouter);
  api.use("/addresses", addressesRouter);
  api.use("/checkout", checkoutRouter);
  api.use("/payments", paymentsRouter);
  api.use("/orders", ordersRouter);

  app.use("/api/v1", api);

  app.get("/", (_req, res) => {
    res.json({ service: "melkoraa-api", version: "v1" });
  });

  return app;
}
