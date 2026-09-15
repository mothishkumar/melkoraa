import { and, count, desc, eq } from "drizzle-orm";

import { addresses, orderItems, orderStatusHistory, orders } from "@/db/schema";
import { orderDb, type OrderDb } from "@/server/repositories/orders/db";
import type { AddressSnapshot } from "@/types/orders";

export function snapshotAddress(row: typeof addresses.$inferSelect): AddressSnapshot {
  return {
    name: row.name,
    phone: row.phone,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    city: row.city,
    state: row.state,
    postalCode: row.postalCode,
    country: row.country,
  };
}

export async function findAddressForUser(userId: string, addressId: string, db?: OrderDb) {
  const client = orderDb(db);
  const [row] = await client
    .select()
    .from(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function findOrderByIdempotency(
  userId: string,
  idempotencyKey: string,
  db?: OrderDb,
) {
  const client = orderDb(db);
  const [row] = await client
    .select()
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.idempotencyKey, idempotencyKey)))
    .limit(1);
  return row ?? null;
}

export async function findOrderById(orderId: string, db?: OrderDb) {
  const client = orderDb(db);
  const [row] = await client.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return row ?? null;
}

export async function findOrderForUser(userId: string, orderId: string, db?: OrderDb) {
  const client = orderDb(db);
  const [row] = await client
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function insertOrder(values: typeof orders.$inferInsert, db?: OrderDb) {
  const client = orderDb(db);
  const [row] = await client.insert(orders).values(values).returning();
  return row;
}

export async function insertOrderItems(
  values: (typeof orderItems.$inferInsert)[],
  db?: OrderDb,
) {
  if (values.length === 0) return [];
  const client = orderDb(db);
  return client.insert(orderItems).values(values).returning();
}

export async function listOrderItems(orderId: string, db?: OrderDb) {
  const client = orderDb(db);
  return client
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))
    .orderBy(orderItems.createdAt);
}

export async function insertStatusHistory(
  values: typeof orderStatusHistory.$inferInsert,
  db?: OrderDb,
) {
  const client = orderDb(db);
  const [row] = await client.insert(orderStatusHistory).values(values).returning();
  return row;
}

export async function updateOrderStatus(
  orderId: string,
  status: typeof orders.$inferSelect.status,
  db?: OrderDb,
  paymentStatus?: typeof orders.$inferSelect.paymentStatus,
) {
  const client = orderDb(db);
  const [row] = await client
    .update(orders)
    .set({
      status,
      ...(paymentStatus ? { paymentStatus } : {}),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
    .returning();
  return row ?? null;
}

export async function listOrdersForUser(
  userId: string,
  page: number,
  pageSize: number,
  db?: OrderDb,
) {
  const client = orderDb(db);
  const offset = (page - 1) * pageSize;
  const [rows, totals] = await Promise.all([
    client
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt), desc(orders.id))
      .limit(pageSize)
      .offset(offset),
    client.select({ value: count() }).from(orders).where(eq(orders.userId, userId)),
  ]);
  return { rows, total: Number(totals[0]?.value ?? 0) };
}

export async function listOrdersAdmin(page: number, pageSize: number, db?: OrderDb) {
  const client = orderDb(db);
  const offset = (page - 1) * pageSize;
  const [rows, totals] = await Promise.all([
    client
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt), desc(orders.id))
      .limit(pageSize)
      .offset(offset),
    client.select({ value: count() }).from(orders),
  ]);
  return { rows, total: Number(totals[0]?.value ?? 0) };
}
