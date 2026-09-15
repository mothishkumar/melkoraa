import { and, eq, isNull } from "drizzle-orm";

import { paymentEvents, payments } from "@/db/schema";
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
