import { and, asc, count, desc, eq } from "drizzle-orm";

import { dropProducts, drops, products } from "@/db/schema";
import { catalogDb, type CatalogDb } from "@/server/repositories/catalog/db";

export async function listPublicDrops(page: number, pageSize: number, db?: CatalogDb) {
  const client = catalogDb(db);
  const offset = (page - 1) * pageSize;
  const where = eq(drops.status, "active");
  const [rows, totals] = await Promise.all([
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
    client.select({ value: count() }).from(drops).where(where),
  ]);
  return { rows, total: Number(totals[0]?.value ?? 0) };
}

export async function listAdminDrops(page: number, pageSize: number, db?: CatalogDb) {
  const client = catalogDb(db);
  const offset = (page - 1) * pageSize;
  const [rows, totals] = await Promise.all([
    client.select().from(drops).orderBy(desc(drops.createdAt)).limit(pageSize).offset(offset),
    client.select({ value: count() }).from(drops),
  ]);
  return { rows, total: Number(totals[0]?.value ?? 0) };
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
