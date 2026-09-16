import { Router } from "express";
import express from "express";

import { processRazorpayWebhook } from "@/server/services/payments/payment-service";

import { asyncHandler, handleRoute } from "../lib/handle-route.js";
import { sendJson } from "../lib/express-response.js";

export const webhooksRouter = Router();

webhooksRouter.post(
  "/razorpay",
  express.raw({ type: "application/json" }),
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const rawBody = typeof req.body === "string" ? req.body : req.body.toString("utf8");
      const signature = req.headers["x-razorpay-signature"]?.toString() ?? "";
      const result = await processRazorpayWebhook({ rawBody, signature });
      sendJson(res, result);
    });
  }),
);
