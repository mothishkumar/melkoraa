import { randomBytes } from "node:crypto";

const ORDER_NUMBER_PATTERN = /^MK-\d{4}-[A-F0-9]{8}$/;

export function generateOrderNumber(now = new Date()): string {
  const year = String(now.getUTCFullYear());
  const suffix = randomBytes(4).toString("hex").toUpperCase();
  return `MK-${year}-${suffix}`;
}

export function isOrderNumber(value: string): boolean {
  return ORDER_NUMBER_PATTERN.test(value);
}

export const CHECKOUT_PAYMENT_PROVIDER = "checkout";
export const INVENTORY_REF_RESERVE = "order_item";
export const INVENTORY_REF_RELEASE = "order_item_release";
