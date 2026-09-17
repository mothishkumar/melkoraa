import { z } from "zod";

import { MAX_CART_ITEM_QUANTITY } from "@/lib/cart/rules";
import { uuidSchema } from "@/lib/validation/catalog";

const finiteInt = z
  .number({ error: "Quantity must be a finite integer." })
  .finite()
  .int("Quantity must be an integer.");

export const cartQuantitySchema = finiteInt
  .positive("Quantity must be greater than zero.")
  .max(MAX_CART_ITEM_QUANTITY, `Quantity cannot exceed ${MAX_CART_ITEM_QUANTITY} per variant.`);

export const addCartItemSchema = z
  .object({
    variantId: uuidSchema,
    quantity: cartQuantitySchema,
  })
  .strict();

export const updateCartItemSchema = z
  .object({
    quantity: cartQuantitySchema,
  })
  .strict();

export { uuidSchema };
