import { z } from "zod";

import { uuidSchema } from "@/lib/validation/catalog";

export const checkoutBodySchema = z
  .object({
    addressId: uuidSchema,
    idempotencyKey: uuidSchema,
    billingAddressId: uuidSchema.optional(),
  })
  .strict();

export const orderStatusFilterSchema = z.enum([
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
]);

export const paymentStatusFilterSchema = z.enum([
  "pending",
  "authorized",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
]);

export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: orderStatusFilterSchema.optional(),
  paymentStatus: paymentStatusFilterSchema.optional(),
  search: z.string().trim().max(64).optional(),
});

export { uuidSchema };
