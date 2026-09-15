import { eq } from "drizzle-orm";

import { payments } from "@/db/schema";
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
