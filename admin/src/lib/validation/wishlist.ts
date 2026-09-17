import { z } from "zod";

import { uuidSchema } from "@/lib/validation/catalog";

export const addWishlistItemSchema = z
  .object({
    productId: uuidSchema,
  })
  .strict();

export const toggleWishlistItemSchema = addWishlistItemSchema;

export { uuidSchema };
