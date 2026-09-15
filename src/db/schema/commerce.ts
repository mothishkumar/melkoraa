import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { productVariants, products } from "./catalog";
import {
  couponDiscountTypeEnum,
  fulfillmentStatusEnum,
  orderStatusEnum,
  paymentStatusEnum,
  reviewStatusEnum,
} from "./enums";
import { createdAtCol, money, updatedAtCol, uuidPkCol } from "./helpers";

export const orders = pgTable(
  "orders",
  {
    id: uuidPkCol(),
    orderNumber: text("order_number").notNull(),
    userId: uuid("user_id"),
    status: orderStatusEnum("status").notNull().default("pending"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
    fulfillmentStatus: fulfillmentStatusEnum("fulfillment_status")
      .notNull()
      .default("unfulfilled"),
    subtotal: money("subtotal").notNull(),
    discountAmount: money("discount_amount").notNull().default("0"),
    shippingAmount: money("shipping_amount").notNull().default("0"),
    taxAmount: money("tax_amount").notNull().default("0"),
    totalAmount: money("total_amount").notNull(),
    currency: text("currency").notNull().default("INR"),
    shippingAddressSnapshot: jsonb("shipping_address_snapshot").notNull(),
    billingAddressSnapshot: jsonb("billing_address_snapshot").notNull(),
    idempotencyKey: text("idempotency_key"),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (table) => [
    uniqueIndex("orders_order_number_uidx").on(table.orderNumber),
    uniqueIndex("orders_user_idempotency_uidx")
      .on(table.userId, table.idempotencyKey)
      .where(sql`${table.userId} IS NOT NULL AND ${table.idempotencyKey} IS NOT NULL`),
    index("orders_user_id_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
    index("orders_created_at_idx").on(table.createdAt),
    check("orders_subtotal_non_negative", sql`${table.subtotal} >= 0`),
    check("orders_discount_non_negative", sql`${table.discountAmount} >= 0`),
    check("orders_shipping_non_negative", sql`${table.shippingAmount} >= 0`),
    check("orders_tax_non_negative", sql`${table.taxAmount} >= 0`),
    check("orders_total_non_negative", sql`${table.totalAmount} >= 0`),
    check("orders_currency_len", sql`char_length(${table.currency}) = 3`),
  ],
).enableRLS();

export const orderItems = pgTable(
  "order_items",
  {
    id: uuidPkCol(),
    orderId: uuid("order_id").notNull(),
    productId: uuid("product_id"),
    variantId: uuid("variant_id"),
    productNameSnapshot: text("product_name_snapshot").notNull(),
    skuSnapshot: text("sku_snapshot").notNull(),
    sizeSnapshot: text("size_snapshot").notNull(),
    colorSnapshot: text("color_snapshot").notNull(),
    unitPrice: money("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
    totalPrice: money("total_price").notNull(),
    createdAt: createdAtCol(),
  },
  (table) => [
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: "order_items_order_id_fkey",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: "order_items_product_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.variantId],
      foreignColumns: [productVariants.id],
      name: "order_items_variant_id_fkey",
    }).onDelete("set null"),
    index("order_items_order_id_idx").on(table.orderId),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
    check("order_items_unit_price_non_negative", sql`${table.unitPrice} >= 0`),
    check("order_items_total_price_non_negative", sql`${table.totalPrice} >= 0`),
  ],
).enableRLS();

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuidPkCol(),
    orderId: uuid("order_id").notNull(),
    oldStatus: orderStatusEnum("old_status"),
    newStatus: orderStatusEnum("new_status").notNull(),
    changedBy: uuid("changed_by"),
    notes: text("notes"),
    createdAt: createdAtCol(),
  },
  (table) => [
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: "order_status_history_order_id_fkey",
    }).onDelete("restrict"),
    index("order_status_history_order_id_idx").on(table.orderId),
  ],
).enableRLS();

export const payments = pgTable(
  "payments",
  {
    id: uuidPkCol(),
    orderId: uuid("order_id").notNull(),
    provider: text("provider").notNull(),
    providerOrderId: text("provider_order_id"),
    providerPaymentId: text("provider_payment_id"),
    amount: money("amount").notNull(),
    currency: text("currency").notNull().default("INR"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (table) => [
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: "payments_order_id_fkey",
    }).onDelete("restrict"),
    index("payments_order_id_idx").on(table.orderId),
    uniqueIndex("payments_provider_payment_id_uidx")
      .on(table.provider, table.providerPaymentId)
      .where(sql`${table.providerPaymentId} IS NOT NULL`),
    uniqueIndex("payments_provider_order_id_uidx")
      .on(table.provider, table.providerOrderId)
      .where(sql`${table.providerOrderId} IS NOT NULL`),
    check("payments_amount_non_negative", sql`${table.amount} >= 0`),
    check("payments_currency_len", sql`char_length(${table.currency}) = 3`),
  ],
).enableRLS();

export const paymentEvents = pgTable(
  "payment_events",
  {
    id: uuidPkCol(),
    provider: text("provider").notNull(),
    providerEventId: text("provider_event_id").notNull(),
    eventType: text("event_type").notNull(),
    paymentId: uuid("payment_id"),
    createdAt: createdAtCol(),
  },
  (table) => [
    foreignKey({
      columns: [table.paymentId],
      foreignColumns: [payments.id],
      name: "payment_events_payment_id_fkey",
    }).onDelete("set null"),
    uniqueIndex("payment_events_provider_event_uidx").on(
      table.provider,
      table.providerEventId,
    ),
    index("payment_events_payment_id_idx").on(table.paymentId),
  ],
).enableRLS();

export const coupons = pgTable(
  "coupons",
  {
    id: uuidPkCol(),
    code: text("code").notNull(),
    description: text("description"),
    discountType: couponDiscountTypeEnum("discount_type").notNull(),
    discountValue: money("discount_value").notNull(),
    minimumOrderValue: money("minimum_order_value"),
    maximumDiscount: money("maximum_discount"),
    usageLimit: integer("usage_limit"),
    usageCount: integer("usage_count").notNull().default(0),
    startsAt: timestamp("starts_at", { withTimezone: true, mode: "date" }),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (table) => [
    uniqueIndex("coupons_code_uidx").on(table.code),
    check("coupons_code_normalized", sql`${table.code} = lower(${table.code})`),
    check("coupons_discount_value_non_negative", sql`${table.discountValue} >= 0`),
    check(
      "coupons_percentage_range",
      sql`${table.discountType} <> 'percentage' OR (${table.discountValue} >= 0 AND ${table.discountValue} <= 100)`,
    ),
    check(
      "coupons_minimum_order_non_negative",
      sql`${table.minimumOrderValue} IS NULL OR ${table.minimumOrderValue} >= 0`,
    ),
    check(
      "coupons_maximum_discount_non_negative",
      sql`${table.maximumDiscount} IS NULL OR ${table.maximumDiscount} >= 0`,
    ),
    check(
      "coupons_usage_limit_positive",
      sql`${table.usageLimit} IS NULL OR ${table.usageLimit} > 0`,
    ),
    check("coupons_usage_count_non_negative", sql`${table.usageCount} >= 0`),
  ],
).enableRLS();

export const couponUsages = pgTable(
  "coupon_usages",
  {
    id: uuidPkCol(),
    couponId: uuid("coupon_id").notNull(),
    userId: uuid("user_id"),
    orderId: uuid("order_id").notNull(),
    discountAmount: money("discount_amount").notNull(),
    createdAt: createdAtCol(),
  },
  (table) => [
    foreignKey({
      columns: [table.couponId],
      foreignColumns: [coupons.id],
      name: "coupon_usages_coupon_id_fkey",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: "coupon_usages_order_id_fkey",
    }).onDelete("restrict"),
    uniqueIndex("coupon_usages_order_coupon_uidx").on(table.orderId, table.couponId),
    uniqueIndex("coupon_usages_user_coupon_uidx")
      .on(table.couponId, table.userId)
      .where(sql`${table.userId} IS NOT NULL`),
    check("coupon_usages_discount_non_negative", sql`${table.discountAmount} >= 0`),
  ],
).enableRLS();

export const reviews = pgTable(
  "reviews",
  {
    id: uuidPkCol(),
    productId: uuid("product_id").notNull(),
    userId: uuid("user_id").notNull(),
    orderId: uuid("order_id").notNull(),
    rating: integer("rating").notNull(),
    title: text("title"),
    body: text("body"),
    status: reviewStatusEnum("status").notNull().default("pending"),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: "reviews_product_id_fkey",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: "reviews_order_id_fkey",
    }).onDelete("restrict"),
    uniqueIndex("reviews_user_product_uidx").on(table.userId, table.productId),
    index("reviews_product_id_idx").on(table.productId),
    index("reviews_user_id_idx").on(table.userId),
    check("reviews_rating_range", sql`${table.rating} >= 1 AND ${table.rating} <= 5`),
  ],
).enableRLS();
