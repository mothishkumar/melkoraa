import { and, asc, count, desc, eq, ilike, isNull, or, type SQL } from "drizzle-orm";

import { orders, paymentEvents, payments } from "@/db/schema";
import { loadPagedRows } from "@/db/paginate";
import { escapeIlike } from "@/lib/catalog/rules";
import { orderDb, type OrderDb } from "@/server/repositories/orders/db";

export async function insertPayment(values: typeof payments.$inferInsert, db?: OrderDb) {
  const client = orderDb(db);
  const [row] = await client.insert(payments).values(values).returning();
  return row;
}

export async function findPaymentForOrder(orderId: string, db?: OrderDb) {
  const client = orderDb(db);
  const [row] = await client
    .select()
    .from(payments)
    .where(eq(payments.orderId, orderId))
    .limit(1);
  return row ?? null;
}

export async function listAdminPayments(
  filters: {
    page: number;
    pageSize: number;
    search?: string;
    provider?: string;
    status?: "pending" | "authorized" | "paid" | "failed" | "refunded" | "partially_refunded";
    sort: "newest" | "oldest" | "amount_asc" | "amount_desc";
  },
  db?: OrderDb,
) {
  const client = orderDb(db);
  const offset = (filters.page - 1) * filters.pageSize;
  const conditions: SQL[] = [];
  if (filters.provider) conditions.push(eq(payments.provider, filters.provider));
  if (filters.status) conditions.push(eq(payments.status, filters.status));
  if (filters.search) {
    const pattern = `%${escapeIlike(filters.search)}%`;
    const search = or(
      ilike(orders.orderNumber, pattern),
      ilike(payments.provider, pattern),
      ilike(payments.providerOrderId, pattern),
    );
    if (search) conditions.push(search);
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const order =
    filters.sort === "oldest"
      ? [asc(payments.createdAt), asc(payments.id)]
      : filters.sort === "amount_asc"
        ? [asc(payments.amount), asc(payments.id)]
        : filters.sort === "amount_desc"
          ? [desc(payments.amount), asc(payments.id)]
          : [desc(payments.createdAt), desc(payments.id)];

  return loadPagedRows(
    () =>
      client
        .select({
          id: payments.id,
          orderId: payments.orderId,
          orderNumber: orders.orderNumber,
          provider: payments.provider,
          status: payments.status,
          amount: payments.amount,
          currency: payments.currency,
          createdAt: payments.createdAt,
        })
        .from(payments)
        .innerJoin(orders, eq(orders.id, payments.orderId))
        .where(where)
        .orderBy(...order)
        .limit(filters.pageSize)
        .offset(offset),
    () =>
      client
        .select({ value: count() })
        .from(payments)
        .innerJoin(orders, eq(orders.id, payments.orderId))
        .where(where),
  );
}

export async function findPaymentByProviderOrderId(
  provider: string,
  providerOrderId: string,
  db?: OrderDb,
  options?: { forUpdate?: boolean },
) {
  const client = orderDb(db);
  const query = client
    .select()
    .from(payments)
    .where(and(eq(payments.provider, provider), eq(payments.providerOrderId, providerOrderId)))
    .limit(1);
  const [row] = options?.forUpdate ? await query.for("update") : await query;
  return row ?? null;
}

export async function updatePaymentStatus(
  paymentId: string,
  status: typeof payments.$inferSelect.status,
  db?: OrderDb,
) {
  const client = orderDb(db);
  const [row] = await client
    .update(payments)
    .set({ status, updatedAt: new Date() })
    .where(eq(payments.id, paymentId))
    .returning();
  return row ?? null;
}

export async function attachProviderOrderId(
  paymentId: string,
  providerOrderId: string,
  db?: OrderDb,
) {
  const client = orderDb(db);
  const [row] = await client
    .update(payments)
    .set({ providerOrderId, updatedAt: new Date() })
    .where(and(eq(payments.id, paymentId), isNull(payments.providerOrderId)))
    .returning();
  return row ?? null;
}

export async function casTransitionPayment(
  paymentId: string,
  fromStatus: typeof payments.$inferSelect.status,
  toStatus: typeof payments.$inferSelect.status,
  extras: { providerPaymentId?: string } | undefined,
  db?: OrderDb,
) {
  const client = orderDb(db);
  const [row] = await client
    .update(payments)
    .set({
      status: toStatus,
      updatedAt: new Date(),
      ...(extras?.providerPaymentId ? { providerPaymentId: extras.providerPaymentId } : {}),
    })
    .where(and(eq(payments.id, paymentId), eq(payments.status, fromStatus)))
    .returning();
  return row ?? null;
}

export async function insertPaymentEventIfNew(
  values: typeof paymentEvents.$inferInsert,
  db?: OrderDb,
) {
  const client = orderDb(db);
  const [row] = await client
    .insert(paymentEvents)
    .values(values)
    .onConflictDoNothing({
      target: [paymentEvents.provider, paymentEvents.providerEventId],
    })
    .returning();
  return row ?? null;
}

export async function findPaymentEvent(
  provider: string,
  providerEventId: string,
  db?: OrderDb,
) {
  const client = orderDb(db);
  const [row] = await client
    .select()
    .from(paymentEvents)
    .where(
      and(eq(paymentEvents.provider, provider), eq(paymentEvents.providerEventId, providerEventId)),
    )
    .limit(1);
  return row ?? null;
}
