import { z } from "zod";

export const adminCustomerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  sort: z.enum(["newest", "oldest", "name_asc", "name_desc"]).default("newest"),
});

export const adminAuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  action: z.string().trim().max(120).optional(),
  entityType: z.string().trim().max(80).optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
});

export const adminPaymentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  provider: z.string().trim().max(64).optional(),
  status: z.enum(["pending", "authorized", "paid", "failed", "refunded", "partially_refunded"]).optional(),
  sort: z.enum(["newest", "oldest", "amount_asc", "amount_desc"]).default("newest"),
});
