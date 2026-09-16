import { z } from "zod";

import { toMoneyString } from "@/lib/catalog/money";
import { isValidSlug, normalizeCategoryFilter, normalizeSlug } from "@/lib/catalog/rules";

export const uuidSchema = z.string().uuid("Invalid id.");

export const slugSchema = z
  .string()
  .trim()
  .min(2, "Slug is too short")
  .max(80, "Slug is too long")
  .transform(normalizeSlug)
  .refine(isValidSlug, "Use a lowercase slug with letters, numbers, and hyphens.");

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const productSortSchema = z.enum([
  "newest",
  "oldest",
  "price_asc",
  "price_desc",
  "name_asc",
  "name_desc",
]);

export type ProductSort = z.infer<typeof productSortSchema>;

const optionalBoolean = z
  .enum(["true", "false"])
  .optional()
  .transform((value) => (value === undefined ? undefined : value === "true"));

const moneyInput = z
  .union([z.string(), z.number()])
  .transform((value, ctx) => {
    try {
      const money = toMoneyString(value);
      if (money.startsWith("-")) {
        ctx.addIssue({ code: "custom", message: "Price cannot be negative." });
        return z.NEVER;
      }
      return money;
    } catch {
      ctx.addIssue({ code: "custom", message: "Enter a valid price." });
      return z.NEVER;
    }
  });

export const publicProductQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  collection: z.string().trim().max(80).optional(),
  drop: z.string().trim().max(80).optional(),
  productType: z.string().trim().max(80).optional(),
  isNew: optionalBoolean,
  sort: productSortSchema.default("newest"),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  status: z.never().optional(),
}).superRefine((value, ctx) => {
  if (value.minPrice !== undefined && value.maxPrice !== undefined && value.minPrice > value.maxPrice) {
    ctx.addIssue({
      code: "custom",
      message: "minPrice cannot be greater than maxPrice.",
      path: ["minPrice"],
    });
  }
});

export type PublicProductQuery = z.infer<typeof publicProductQuerySchema> & {
  categorySlug?: string;
};

export function parsePublicProductQuery(input: Record<string, string | undefined>) {
  const parsed = publicProductQuerySchema.parse(input);
  const categorySlug = parsed.productType
    ? normalizeCategoryFilter(parsed.productType)
    : parsed.category
      ? normalizeCategoryFilter(parsed.category)
      : undefined;
  return { ...parsed, categorySlug };
}

export const publicListQuerySchema = paginationSchema;

export const categorySortSchema = z.enum(["name_asc", "name_desc", "newest", "oldest"]);

export const adminCategoryQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(120).optional(),
  sort: categorySortSchema.default("name_asc"),
});

export const adminProductQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(120).optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  sort: productSortSchema.default("newest"),
});

export const productStatusSchema = z.enum(["draft", "active", "archived"]);
export const collectionStatusSchema = z.enum(["draft", "active", "archived"]);
export const dropStatusSchema = z.enum([
  "draft",
  "scheduled",
  "active",
  "ended",
  "archived",
]);

export const adminDropQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(120).optional(),
  status: dropStatusSchema.optional(),
  sort: z.enum(["newest", "oldest", "name_asc", "name_desc", "start_asc", "start_desc"]).default("newest"),
});

export const adminCollectionQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(120).optional(),
  status: collectionStatusSchema.optional(),
  sort: z.enum(["newest", "oldest", "name_asc", "name_desc"]).default("newest"),
});

export const imageTypeSchema = z.enum([
  "primary",
  "secondary",
  "back",
  "detail",
  "lifestyle",
]);

const nameSchema = z.string().trim().min(2).max(120);

export const createProductSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  shortDescription: z.string().trim().max(280).nullable().optional(),
  description: z.string().trim().max(8000).nullable().optional(),
  basePrice: moneyInput,
  compareAtPrice: moneyInput.nullable().optional(),
  brand: z.string().trim().min(1).max(80).optional(),
  status: productStatusSchema.optional(),
  seoTitle: z.string().trim().max(120).nullable().optional(),
  seoDescription: z.string().trim().max(300).nullable().optional(),
  categoryIds: z.array(uuidSchema).max(20).optional(),
}).strict();

export const updateProductSchema = createProductSchema.partial().strict();

export const createVariantSchema = z.object({
  sku: z.string().trim().min(2).max(64),
  size: z.string().trim().min(1).max(32),
  color: z.string().trim().min(1).max(64),
  colorCode: z.string().trim().max(16).nullable().optional(),
  price: moneyInput,
  compareAtPrice: moneyInput.nullable().optional(),
  barcode: z.string().trim().max(64).nullable().optional(),
  isActive: z.boolean().optional(),
}).strict();

export const updateVariantSchema = createVariantSchema.partial().strict();

export const updateImageSchema = z
  .object({
    altText: z.string().trim().max(200).nullable().optional(),
    sortOrder: z.number().int().min(0).max(1000).optional(),
    imageType: imageTypeSchema.optional(),
    variantId: uuidSchema.nullable().optional(),
  })
  .strict();

export const createCategorySchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  description: z.string().trim().max(1000).nullable().optional(),
}).strict();

export const updateCategorySchema = createCategorySchema.partial().strict();

export const createCollectionSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  description: z.string().trim().max(2000).nullable().optional(),
  status: collectionStatusSchema.optional(),
  heroImageUrl: z.string().url().max(500).nullable().optional(),
  seoTitle: z.string().trim().max(120).nullable().optional(),
  seoDescription: z.string().trim().max(300).nullable().optional(),
}).strict();

export const updateCollectionSchema = createCollectionSchema.partial().strict();

export const createDropSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  description: z.string().trim().max(2000).nullable().optional(),
  status: dropStatusSchema.optional(),
  startAt: z.string().datetime().nullable().optional(),
  endAt: z.string().datetime().nullable().optional(),
  isLimited: z.boolean().optional(),
  isNeverRestocked: z.boolean().optional(),
}).strict();

export const updateDropSchema = createDropSchema.partial().strict();

export const dropProductSchema = z
  .object({
    productId: uuidSchema,
    displayOrder: z.number().int().min(0).max(1000).optional(),
  })
  .strict();

export function searchParamsRecord(url: URL): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  url.searchParams.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}
