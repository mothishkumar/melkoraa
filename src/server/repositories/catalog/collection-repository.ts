import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";

import { collections } from "@/db/schema";
import { loadPagedRows } from "@/db/paginate";
import { escapeIlike } from "@/lib/catalog/rules";
import { catalogDb, type CatalogDb } from "@/server/repositories/catalog/db";

export async function listPublicCollections(page: number, pageSize: number, db?: CatalogDb) {
  const client = catalogDb(db);
  const offset = (page - 1) * pageSize;
  const where = eq(collections.status, "active");
  return loadPagedRows(
    () =>
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
    () => client.select({ value: count() }).from(collections).where(where),
  );
}

export async function listAdminCollections(
  filters: {
    page: number;
    pageSize: number;
    search?: string;
    status?: "draft" | "active" | "archived";
    sort: "newest" | "oldest" | "name_asc" | "name_desc";
  },
  db?: CatalogDb,
) {
  const client = catalogDb(db);
  const offset = (filters.page - 1) * filters.pageSize;
  const conditions: SQL[] = [];
  if (filters.status) conditions.push(eq(collections.status, filters.status));
  if (filters.search) {
    const pattern = `%${escapeIlike(filters.search)}%`;
    const search = or(
      ilike(collections.name, pattern),
      ilike(collections.slug, pattern),
      ilike(collections.description, pattern),
    );
    if (search) conditions.push(search);
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const order =
    filters.sort === "oldest"
      ? [asc(collections.createdAt), asc(collections.id)]
      : filters.sort === "name_asc"
        ? [asc(collections.name), asc(collections.id)]
        : filters.sort === "name_desc"
          ? [desc(collections.name), asc(collections.id)]
          : [desc(collections.createdAt), desc(collections.id)];
  return loadPagedRows(
    () =>
      client
        .select()
        .from(collections)
        .where(where)
        .orderBy(...order)
        .limit(filters.pageSize)
        .offset(offset),
    () => client.select({ value: count() }).from(collections).where(where),
  );
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
