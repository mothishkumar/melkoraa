import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";

import { dropProducts, drops, products } from "@/db/schema";
import { loadPagedRows } from "@/db/paginate";
import { escapeIlike } from "@/lib/catalog/rules";
import { catalogDb, type CatalogDb } from "@/server/repositories/catalog/db";

export async function listPublicDrops(page: number, pageSize: number, db?: CatalogDb) {
  const client = catalogDb(db);
  const offset = (page - 1) * pageSize;
  const where = eq(drops.status, "active");
  return loadPagedRows(
    () =>
      client
        .select({
          id: drops.id,
          name: drops.name,
          slug: drops.slug,
          description: drops.description,
          status: drops.status,
          startAt: drops.startAt,
          endAt: drops.endAt,
          isLimited: drops.isLimited,
          isNeverRestocked: drops.isNeverRestocked,
        })
        .from(drops)
        .where(where)
        .orderBy(desc(drops.createdAt))
        .limit(pageSize)
        .offset(offset),
    () => client.select({ value: count() }).from(drops).where(where),
  );
}

export async function listAdminDrops(
  filters: {
    page: number;
    pageSize: number;
    search?: string;
    status?: "draft" | "scheduled" | "active" | "ended" | "archived";
    sort: "newest" | "oldest" | "name_asc" | "name_desc" | "start_asc" | "start_desc";
  },
  db?: CatalogDb,
) {
  const client = catalogDb(db);
  const offset = (filters.page - 1) * filters.pageSize;
  const conditions: SQL[] = [];
  if (filters.status) conditions.push(eq(drops.status, filters.status));
  if (filters.search) {
    const pattern = `%${escapeIlike(filters.search)}%`;
    const search = or(
      ilike(drops.name, pattern),
      ilike(drops.slug, pattern),
      ilike(drops.description, pattern),
    );
    if (search) conditions.push(search);
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const order =
    filters.sort === "oldest"
      ? [asc(drops.createdAt), asc(drops.id)]
      : filters.sort === "name_asc"
        ? [asc(drops.name), asc(drops.id)]
        : filters.sort === "name_desc"
          ? [desc(drops.name), asc(drops.id)]
          : filters.sort === "start_asc"
            ? [asc(drops.startAt), asc(drops.id)]
            : filters.sort === "start_desc"
              ? [desc(drops.startAt), asc(drops.id)]
              : [desc(drops.createdAt), desc(drops.id)];
  return loadPagedRows(
    () =>
      client.select().from(drops).where(where).orderBy(...order).limit(filters.pageSize).offset(offset),
    () => client.select({ value: count() }).from(drops).where(where),
  );
}

export async function findDropBySlug(slug: string, db?: CatalogDb) {
  const client = catalogDb(db);
  const [row] = await client.select().from(drops).where(eq(drops.slug, slug)).limit(1);
  return row ?? null;
}

export async function findDropById(id: string, db?: CatalogDb) {
  const client = catalogDb(db);
  const [row] = await client.select().from(drops).where(eq(drops.id, id)).limit(1);
  return row ?? null;
}

export async function listDropProducts(dropId: string, publicProductsOnly: boolean, db?: CatalogDb) {
  const client = catalogDb(db);
  const conditions = [eq(dropProducts.dropId, dropId)];
  if (publicProductsOnly) {
    conditions.push(eq(products.status, "active"));
  }

  return client
    .select({
      productId: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      basePrice: products.basePrice,
      compareAtPrice: products.compareAtPrice,
      status: products.status,
      createdAt: products.createdAt,
      displayOrder: dropProducts.displayOrder,
    })
    .from(dropProducts)
    .innerJoin(products, eq(products.id, dropProducts.productId))
    .where(and(...conditions))
    .orderBy(asc(dropProducts.displayOrder), asc(products.name));
}

export async function insertDrop(values: typeof drops.$inferInsert, db?: CatalogDb) {
  const client = catalogDb(db);
  const [row] = await client.insert(drops).values(values).returning();
  return row;
}

export async function updateDropById(
  id: string,
  values: Partial<typeof drops.$inferInsert>,
  db?: CatalogDb,
) {
  const client = catalogDb(db);
  const [row] = await client
    .update(drops)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(drops.id, id))
    .returning();
  return row ?? null;
}

export async function addProductToDrop(
  dropId: string,
  productId: string,
  displayOrder = 0,
  db?: CatalogDb,
) {
  const client = catalogDb(db);
  await client
    .insert(dropProducts)
    .values({ dropId, productId, displayOrder })
    .onConflictDoUpdate({
      target: [dropProducts.dropId, dropProducts.productId],
      set: { displayOrder },
    });
}

export async function removeProductFromDrop(dropId: string, productId: string, db?: CatalogDb) {
  const client = catalogDb(db);
  await client
    .delete(dropProducts)
    .where(and(eq(dropProducts.dropId, dropId), eq(dropProducts.productId, productId)));
}

export async function findDropProduct(dropId: string, productId: string, db?: CatalogDb) {
  const client = catalogDb(db);
  const [row] = await client
    .select()
    .from(dropProducts)
    .where(and(eq(dropProducts.dropId, dropId), eq(dropProducts.productId, productId)))
    .limit(1);
  return row ?? null;
}
