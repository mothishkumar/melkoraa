import { z } from "zod";

export const verifyPaymentBodySchema = z
  .object({
    razorpayPaymentId: z.string().min(1),
    razorpayOrderId: z.string().min(1),
    razorpaySignature: z.string().min(1),
  })
  .strict();

export const razorpayPaymentEntitySchema = z.object({
  id: z.string().min(1),
  order_id: z.string().min(1),
  amount: z.coerce.number().int().nonnegative(),
  currency: z.string().length(3),
  status: z.string().optional(),
});

export const razorpayWebhookBodySchema = z
  .object({
    event: z.string().min(1),
    payload: z
      .object({
        payment: z
          .object({
            entity: razorpayPaymentEntitySchema,
          })
          .optional(),
      })
      .passthrough(),
  })
  .passthrough();
