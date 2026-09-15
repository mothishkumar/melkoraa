import { count, desc, eq } from "drizzle-orm";

import { collections } from "@/db/schema";
import { catalogDb, type CatalogDb } from "@/server/repositories/catalog/db";

export async function listPublicCollections(page: number, pageSize: number, db?: CatalogDb) {
  const client = catalogDb(db);
  const offset = (page - 1) * pageSize;
  const where = eq(collections.status, "active");
  const [rows, totals] = await Promise.all([
    client
      .select({
        id: collections.id,
        name: collections.name,
        slug: collections.slug,
        description: collections.description,
        status: collections.status,
        heroImageUrl: collections.heroImageUrl,
      })
      .from(collections)
      .where(where)
      .orderBy(desc(collections.createdAt))
      .limit(pageSize)
      .offset(offset),
    client.select({ value: count() }).from(collections).where(where),
  ]);
  return { rows, total: Number(totals[0]?.value ?? 0) };
}

export async function listAdminCollections(page: number, pageSize: number, db?: CatalogDb) {
  const client = catalogDb(db);
  const offset = (page - 1) * pageSize;
  const [rows, totals] = await Promise.all([
    client
      .select()
      .from(collections)
      .orderBy(desc(collections.createdAt))
      .limit(pageSize)
      .offset(offset),
    client.select({ value: count() }).from(collections),
  ]);
  return { rows, total: Number(totals[0]?.value ?? 0) };
}

export async function findCollectionById(id: string, db?: CatalogDb) {
  const client = catalogDb(db);
  const [row] = await client.select().from(collections).where(eq(collections.id, id)).limit(1);
  return row ?? null;
}

export async function insertCollection(
  values: typeof collections.$inferInsert,
  db?: CatalogDb,
) {
  const client = catalogDb(db);
  const [row] = await client.insert(collections).values(values).returning();
  return row;
}

export async function updateCollectionById(
  id: string,
  values: Partial<typeof collections.$inferInsert>,
  db?: CatalogDb,
) {
  const client = catalogDb(db);
  const [row] = await client
    .update(collections)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(collections.id, id))
    .returning();
  return row ?? null;
}
