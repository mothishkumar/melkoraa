import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { productVariants, products } from "./catalog";
import { cartStatusEnum } from "./enums";
import { createdAtCol, money, updatedAtCol, uuidPkCol } from "./helpers";

export const carts = pgTable(
  "carts",
  {
    id: uuidPkCol(),
    userId: uuid("user_id"),
    sessionId: text("session_id"),
    status: cartStatusEnum("status").notNull().default("active"),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (table) => [
    index("carts_user_id_idx").on(table.userId),
    index("carts_session_id_idx").on(table.sessionId),
    uniqueIndex("carts_active_user_uidx")
      .on(table.userId)
      .where(sql`${table.status} = 'active' AND ${table.userId} IS NOT NULL`),
    uniqueIndex("carts_active_session_uidx")
      .on(table.sessionId)
      .where(sql`${table.status} = 'active' AND ${table.sessionId} IS NOT NULL`),
    check(
      "carts_owner_present",
      sql`${table.userId} IS NOT NULL OR ${table.sessionId} IS NOT NULL`,
    ),
  ],
).enableRLS();

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuidPkCol(),
    cartId: uuid("cart_id").notNull(),
    variantId: uuid("variant_id").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: money("unit_price").notNull(),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (table) => [
    foreignKey({
      columns: [table.cartId],
      foreignColumns: [carts.id],
      name: "cart_items_cart_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.variantId],
      foreignColumns: [productVariants.id],
      name: "cart_items_variant_id_fkey",
    }).onDelete("restrict"),
    uniqueIndex("cart_items_cart_variant_uidx").on(table.cartId, table.variantId),
    index("cart_items_cart_id_idx").on(table.cartId),
    check("cart_items_quantity_positive", sql`${table.quantity} > 0`),
    check("cart_items_unit_price_non_negative", sql`${table.unitPrice} >= 0`),
  ],
).enableRLS();

export const wishlists = pgTable(
  "wishlists",
  {
    id: uuidPkCol(),
    userId: uuid("user_id").notNull(),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (table) => [uniqueIndex("wishlists_user_id_uidx").on(table.userId)],
).enableRLS();

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    wishlistId: uuid("wishlist_id").notNull(),
    productId: uuid("product_id").notNull(),
    createdAt: createdAtCol(),
  },
  (table) => [
    primaryKey({
      columns: [table.wishlistId, table.productId],
      name: "wishlist_items_pkey",
    }),
    foreignKey({
      columns: [table.wishlistId],
      foreignColumns: [wishlists.id],
      name: "wishlist_items_wishlist_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: "wishlist_items_product_id_fkey",
    }).onDelete("cascade"),
  ],
).enableRLS();
