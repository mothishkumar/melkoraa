import { z } from "zod";

import { uuidSchema } from "@/lib/validation/catalog";

export const checkoutBodySchema = z
  .object({
    addressId: uuidSchema,
    idempotencyKey: uuidSchema,
    billingAddressId: uuidSchema.optional(),
  })
  .strict();

export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export { uuidSchema };
