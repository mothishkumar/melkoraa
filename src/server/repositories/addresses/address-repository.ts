import { and, desc, eq } from "drizzle-orm";

import { addresses } from "@/db/schema";
import { orderDb, type OrderDb } from "@/server/repositories/orders/db";

export async function listAddressesForUser(userId: string, db?: OrderDb) {
  const client = orderDb(db);
  return client
    .select()
    .from(addresses)
    .where(eq(addresses.userId, userId))
    .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
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

export async function insertAddress(values: typeof addresses.$inferInsert, db?: OrderDb) {
  const client = orderDb(db);
  const [row] = await client.insert(addresses).values(values).returning();
  return row;
}

export async function updateAddressRow(
  userId: string,
  addressId: string,
  values: Partial<typeof addresses.$inferInsert>,
  db?: OrderDb,
) {
  const client = orderDb(db);
  const [row] = await client
    .update(addresses)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
    .returning();
  return row ?? null;
}

export async function deleteAddressRow(userId: string, addressId: string, db?: OrderDb) {
  const client = orderDb(db);
  const [row] = await client
    .delete(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
    .returning();
  return row ?? null;
}

export async function clearDefaultAddresses(userId: string, db?: OrderDb) {
  const client = orderDb(db);
  await client
    .update(addresses)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(eq(addresses.userId, userId));
}
