import { z } from "zod";

import { MAX_STOCK_DELTA } from "@/lib/inventory/rules";
import { uuidSchema } from "@/lib/validation/catalog";

const finiteInt = z
  .number({ error: "Quantity must be a finite integer." })
  .finite()
  .int("Quantity must be an integer.");

export const stockQuantitySchema = finiteInt
  .positive("Quantity must be greater than zero.")
  .max(MAX_STOCK_DELTA, "Quantity is too large.");

export const adjustDeltaSchema = finiteInt
  .refine((value) => value !== 0, "Adjustment cannot be zero.")
  .min(-MAX_STOCK_DELTA, "Quantity is too large.")
  .max(MAX_STOCK_DELTA, "Quantity is too large.");

export const nonNegativeStockSchema = finiteInt
  .min(0, "Quantity cannot be negative.")
  .max(MAX_STOCK_DELTA, "Quantity is too large.");

const notesSchema = z.string().trim().max(500).nullable().optional();
const referenceTypeSchema = z.string().trim().max(64).nullable().optional();

export const inventorySortSchema = z.enum([
  "updated_desc",
  "updated_asc",
  "on_hand_desc",
  "on_hand_asc",
  "available_desc",
  "available_asc",
  "sku_asc",
  "sku_desc",
  "reserved_desc",
]);

export type InventorySort = z.infer<typeof inventorySortSchema>;

export const inventoryListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(120).optional(),
    productId: uuidSchema.optional(),
    sku: z.string().trim().max(64).optional(),
    availability: z.enum(["in_stock", "out_of_stock", "low_stock"]).optional(),
    sort: inventorySortSchema.default("updated_desc"),
  });

export const initializeInventorySchema = z
  .object({
    variantId: uuidSchema,
    onHand: nonNegativeStockSchema.optional(),
    reorderLevel: nonNegativeStockSchema.optional(),
    notes: notesSchema,
  })
  .strict();

export const adjustInventorySchema = z
  .object({
    delta: adjustDeltaSchema,
    notes: notesSchema,
    referenceType: referenceTypeSchema,
    referenceId: uuidSchema.nullable().optional(),
  })
  .strict();

export const stockMutationSchema = z
  .object({
    quantity: stockQuantitySchema,
    notes: notesSchema,
    referenceType: referenceTypeSchema,
    referenceId: uuidSchema.nullable().optional(),
  })
  .strict();

export { uuidSchema };
