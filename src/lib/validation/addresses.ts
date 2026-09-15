import { z } from "zod";

import { uuidSchema } from "@/lib/validation/catalog";

const name = z.string().trim().min(2, "Enter a name.").max(120);
const line = z.string().trim().min(1, "Enter an address.").max(200);
const optionalLine = z.string().trim().max(200).optional();
const city = z.string().trim().min(2, "Enter a city.").max(80);
const region = z.string().trim().min(2, "Enter a state.").max(80);
const postal = z.string().trim().min(3, "Enter a postal code.").max(12);
const country = z.string().trim().min(2).max(56);
const phone = z.string().trim().max(20).optional();

export const addressBodySchema = z
  .object({
    name,
    phone,
    addressLine1: line,
    addressLine2: optionalLine,
    city,
    state: region,
    postalCode: postal,
    country: country.default("IN"),
    isDefault: z.boolean().optional(),
  })
  .strict();

export const updateAddressBodySchema = addressBodySchema.partial().strict();

export { uuidSchema };
