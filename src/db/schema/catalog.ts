import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  collectionStatusEnum,
  dropStatusEnum,
  productImageTypeEnum,
  productStatusEnum,
} from "./enums";
import { createdAtCol, money, updatedAtCol, uuidPkCol } from "./helpers";

export const categories = pgTable(
  "categories",
  {
    id: uuidPkCol(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (table) => [
    uniqueIndex("categories_slug_uidx").on(table.slug),
    check("categories_slug_not_empty", sql`char_length(btrim(${table.slug})) > 0`),
  ],
).enableRLS();

export const collections = pgTable(
  "collections",
  {
    id: uuidPkCol(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    status: collectionStatusEnum("status").notNull().default("draft"),
    heroImageUrl: text("hero_image_url"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (table) => [
    uniqueIndex("collections_slug_uidx").on(table.slug),
    index("collections_status_idx").on(table.status),
  ],
).enableRLS();

export const drops = pgTable(
  "drops",
  {
    id: uuidPkCol(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    startAt: timestamp("start_at", { withTimezone: true, mode: "date" }),
    endAt: timestamp("end_at", { withTimezone: true, mode: "date" }),
    status: dropStatusEnum("status").notNull().default("draft"),
    isLimited: boolean("is_limited").notNull().default(true),
    isNeverRestocked: boolean("is_never_restocked").notNull().default(true),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (table) => [
    uniqueIndex("drops_slug_uidx").on(table.slug),
    index("drops_status_idx").on(table.status),
    check(
      "drops_end_after_start",
      sql`${table.endAt} IS NULL OR ${table.startAt} IS NULL OR ${table.endAt} >= ${table.startAt}`,
    ),
  ],
).enableRLS();

export const products = pgTable(
  "products",
  {
    id: uuidPkCol(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    shortDescription: text("short_description"),
    description: text("description"),
    status: productStatusEnum("status").notNull().default("draft"),
    basePrice: money("base_price").notNull(),
    compareAtPrice: money("compare_at_price"),
    brand: text("brand").notNull().default("MELKORAA"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (table) => [
    uniqueIndex("products_slug_uidx").on(table.slug),
    index("products_status_idx").on(table.status),
    check("products_base_price_non_negative", sql`${table.basePrice} >= 0`),
    check(
      "products_compare_at_price_non_negative",
      sql`${table.compareAtPrice} IS NULL OR ${table.compareAtPrice} >= 0`,
    ),
  ],
).enableRLS();

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuidPkCol(),
    productId: uuid("product_id").notNull(),
    sku: text("sku").notNull(),
    size: text("size").notNull(),
    color: text("color").notNull(),
    colorCode: text("color_code"),
    price: money("price").notNull(),
    compareAtPrice: money("compare_at_price"),
    barcode: text("barcode"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: "product_variants_product_id_fkey",
    }).onDelete("restrict"),
    uniqueIndex("product_variants_sku_uidx").on(table.sku),
    index("product_variants_product_id_idx").on(table.productId),
    index("product_variants_is_active_idx").on(table.isActive),
    check("product_variants_price_non_negative", sql`${table.price} >= 0`),
    check(
      "product_variants_compare_at_price_non_negative",
      sql`${table.compareAtPrice} IS NULL OR ${table.compareAtPrice} >= 0`,
    ),
    check("product_variants_sku_not_empty", sql`char_length(btrim(${table.sku})) > 0`),
  ],
).enableRLS();

export const productImages = pgTable(
  "product_images",
  {
    id: uuidPkCol(),
    productId: uuid("product_id").notNull(),
    variantId: uuid("variant_id"),
    imageUrl: text("image_url").notNull(),
    storagePath: text("storage_path").notNull(),
    altText: text("alt_text"),
    imageType: productImageTypeEnum("image_type").notNull().default("secondary"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAtCol(),
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: "product_images_product_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.variantId],
      foreignColumns: [productVariants.id],
      name: "product_images_variant_id_fkey",
    }).onDelete("set null"),
    index("product_images_product_id_idx").on(table.productId),
    index("product_images_variant_id_idx").on(table.variantId),
    index("product_images_sort_order_idx").on(table.productId, table.sortOrder),
  ],
).enableRLS();

export const productCategories = pgTable(
  "product_categories",
  {
    productId: uuid("product_id").notNull(),
    categoryId: uuid("category_id").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.productId, table.categoryId],
      name: "product_categories_pkey",
    }),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: "product_categories_product_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [categories.id],
      name: "product_categories_category_id_fkey",
    }).onDelete("cascade"),
    index("product_categories_category_id_idx").on(table.categoryId),
  ],
).enableRLS();

export const dropProducts = pgTable(
  "drop_products",
  {
    dropId: uuid("drop_id").notNull(),
    productId: uuid("product_id").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => [
    primaryKey({
      columns: [table.dropId, table.productId],
      name: "drop_products_pkey",
    }),
    foreignKey({
      columns: [table.dropId],
      foreignColumns: [drops.id],
      name: "drop_products_drop_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: "drop_products_product_id_fkey",
    }).onDelete("restrict"),
    index("drop_products_product_id_idx").on(table.productId),
  ],
).enableRLS();

export const productEditions = pgTable(
  "product_editions",
  {
    id: uuidPkCol(),
    productId: uuid("product_id").notNull(),
    variantId: uuid("variant_id"),
    editionNumber: integer("edition_number").notNull(),
    editionSize: integer("edition_size").notNull(),
    createdAt: createdAtCol(),
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: "product_editions_product_id_fkey",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.variantId],
      foreignColumns: [productVariants.id],
      name: "product_editions_variant_id_fkey",
    }).onDelete("set null"),
    uniqueIndex("product_editions_variant_number_uidx")
      .on(table.variantId, table.editionNumber)
      .where(sql`${table.variantId} IS NOT NULL`),
    uniqueIndex("product_editions_product_number_uidx")
      .on(table.productId, table.editionNumber)
      .where(sql`${table.variantId} IS NULL`),
    check("product_editions_number_positive", sql`${table.editionNumber} > 0`),
    check("product_editions_size_positive", sql`${table.editionSize} > 0`),
    check(
      "product_editions_number_within_size",
      sql`${table.editionNumber} <= ${table.editionSize}`,
    ),
  ],
).enableRLS();
