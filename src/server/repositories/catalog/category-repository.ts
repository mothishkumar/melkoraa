import { asc, count, eq, inArray } from "drizzle-orm";

import { categories, productCategories } from "@/db/schema";
import { loadPagedRows } from "@/db/paginate";
import { catalogDb, type CatalogDb } from "@/server/repositories/catalog/db";

export async function listCategories(
  page: number,
  pageSize: number,
  db?: CatalogDb,
) {
  const client = catalogDb(db);
  const offset = (page - 1) * pageSize;
  return loadPagedRows(
    () =>
      client
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          description: categories.description,
        })
        .from(categories)
        .orderBy(asc(categories.name))
        .limit(pageSize)
        .offset(offset),
    () => client.select({ value: count() }).from(categories),
  );
}

export async function findCategoryById(id: string, db?: CatalogDb) {
  const client = catalogDb(db);
  const [row] = await client.select().from(categories).where(eq(categories.id, id)).limit(1);
  return row ?? null;
}

export async function insertCategory(
  values: typeof categories.$inferInsert,
  db?: CatalogDb,
) {
  const client = catalogDb(db);
  const [row] = await client.insert(categories).values(values).returning();
  return row;
}

export async function updateCategoryById(
  id: string,
  values: Partial<typeof categories.$inferInsert>,
  db?: CatalogDb,
) {
  const client = catalogDb(db);
  const [row] = await client
    .update(categories)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(categories.id, id))
    .returning();
  return row ?? null;
}

export async function countProductsInCategory(categoryId: string, db?: CatalogDb) {
  const client = catalogDb(db);
  const [row] = await client
    .select({ value: count() })
    .from(productCategories)
    .where(eq(productCategories.categoryId, categoryId));
  return Number(row?.value ?? 0);
}

export async function deleteCategoryById(id: string, db?: CatalogDb) {
  const client = catalogDb(db);
  await client.delete(categories).where(eq(categories.id, id));
}

export async function categoriesExist(ids: string[], db?: CatalogDb) {
  if (ids.length === 0) return true;
  const unique = [...new Set(ids)];
  const client = catalogDb(db);
  const found = await client
    .select({ id: categories.id })
    .from(categories)
    .where(inArray(categories.id, unique));
  return found.length === unique.length;
}
