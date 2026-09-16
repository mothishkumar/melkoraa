import { and, count, desc, eq, ilike, inArray, type SQL } from "drizzle-orm";

import { addresses, orderItems, orderStatusHistory, orders } from "@/db/schema";
import { loadPagedRows } from "@/db/paginate";
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

export async function listOrderItemsForOrders(orderIds: string[], db?: OrderDb) {
  if (orderIds.length === 0) return [];
  const client = orderDb(db);
  return client
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds))
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
  return loadPagedRows(
    () =>
      client
        .select()
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt), desc(orders.id))
        .limit(pageSize)
        .offset(offset),
    () => client.select({ value: count() }).from(orders).where(eq(orders.userId, userId)),
  );
}

export async function listOrderStatusHistory(orderId: string, db?: OrderDb) {
  const client = orderDb(db);
  return client
    .select({
      id: orderStatusHistory.id,
      oldStatus: orderStatusHistory.oldStatus,
      newStatus: orderStatusHistory.newStatus,
      notes: orderStatusHistory.notes,
      createdAt: orderStatusHistory.createdAt,
    })
    .from(orderStatusHistory)
    .where(eq(orderStatusHistory.orderId, orderId))
    .orderBy(desc(orderStatusHistory.createdAt));
}

export async function countOrdersByStatus(db?: OrderDb) {
  const client = orderDb(db);
  return client
    .select({
      status: orders.status,
      value: count(),
    })
    .from(orders)
    .groupBy(orders.status);
}

export async function countOrdersByPaymentStatus(db?: OrderDb) {
  const client = orderDb(db);
  return client
    .select({
      paymentStatus: orders.paymentStatus,
      value: count(),
    })
    .from(orders)
    .groupBy(orders.paymentStatus);
}

export async function countOrdersForUsers(userIds: string[], db?: OrderDb) {
  if (userIds.length === 0) return [];
  const client = orderDb(db);
  return client
    .select({
      userId: orders.userId,
      value: count(),
    })
    .from(orders)
    .where(inArray(orders.userId, userIds))
    .groupBy(orders.userId);
}

export async function listOrdersAdmin(
  filters: {
    page: number;
    pageSize: number;
    status?: typeof orders.$inferSelect.status;
    paymentStatus?: typeof orders.$inferSelect.paymentStatus;
    search?: string;
  },
  db?: OrderDb,
) {
  const client = orderDb(db);
  const offset = (filters.page - 1) * filters.pageSize;
  const conditions: SQL[] = [];
  if (filters.status) conditions.push(eq(orders.status, filters.status));
  if (filters.paymentStatus) conditions.push(eq(orders.paymentStatus, filters.paymentStatus));
  if (filters.search) {
    conditions.push(ilike(orders.orderNumber, `%${filters.search}%`));
  }
  const where = conditions.length ? and(...conditions) : undefined;
  return loadPagedRows(
    () =>
      client
        .select()
        .from(orders)
        .where(where)
        .orderBy(desc(orders.createdAt), desc(orders.id))
        .limit(filters.pageSize)
        .offset(offset),
    () => client.select({ value: count() }).from(orders).where(where),
  );
}
