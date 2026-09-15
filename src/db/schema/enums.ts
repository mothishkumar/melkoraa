import { pgEnum } from "drizzle-orm/pg-core";

export const appRoleEnum = pgEnum("app_role", [
  "customer",
  "staff",
  "manager",
  "admin",
]);

export const productStatusEnum = pgEnum("product_status", [
  "draft",
  "active",
  "archived",
]);

export const collectionStatusEnum = pgEnum("collection_status", [
  "draft",
  "active",
  "archived",
]);

export const dropStatusEnum = pgEnum("drop_status", [
  "draft",
  "scheduled",
  "active",
  "ended",
  "archived",
]);

export const productImageTypeEnum = pgEnum("product_image_type", [
  "primary",
  "secondary",
  "back",
  "detail",
  "lifestyle",
]);

export const inventoryTransactionTypeEnum = pgEnum("inventory_transaction_type", [
  "purchase",
  "reservation",
  "release",
  "sale",
  "adjustment",
  "return",
]);

export const cartStatusEnum = pgEnum("cart_status", [
  "active",
  "converted",
  "abandoned",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "authorized",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
]);

export const fulfillmentStatusEnum = pgEnum("fulfillment_status", [
  "unfulfilled",
  "processing",
  "shipped",
  "delivered",
  "returned",
]);

export const couponDiscountTypeEnum = pgEnum("coupon_discount_type", [
  "percentage",
  "fixed",
]);

export const reviewStatusEnum = pgEnum("review_status", [
  "pending",
  "approved",
  "rejected",
]);
