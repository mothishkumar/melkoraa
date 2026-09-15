import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import {
  categories,
  collections,
  dropProducts,
  drops,
  inventory,
  productCategories,
  productEditions,
  productImages,
  products,
  productVariants,
} from "@/db/schema";
import { escapeIlike, newProductCutoff } from "@/lib/catalog/rules";
import type { ProductSort } from "@/lib/validation/catalog";
import { catalogDb, type CatalogDb } from "@/server/repositories/catalog/db";

export type PublicProductFilters = {
  page: number;
  pageSize: number;
  search?: string;
  categorySlug?: string;
  dropSlug?: string;
  requireActiveDrop?: boolean;
  isNew?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort: ProductSort;
};

export type AdminProductFilters = {
  page: number;
  pageSize: number;
  search?: string;
  status?: "draft" | "active" | "archived";
  sort: ProductSort;
};

function sortExpression(sort: ProductSort) {
  switch (sort) {
    case "oldest":
      return [asc(products.createdAt), asc(products.id)] as const;
    case "price_asc":
      return [asc(products.basePrice), asc(products.id)] as const;
    case "price_desc":
      return [desc(products.basePrice), asc(products.id)] as const;
    case "name_asc":
      return [asc(products.name), asc(products.id)] as const;
    case "name_desc":
      return [desc(products.name), asc(products.id)] as const;
    default:
      return [desc(products.createdAt), asc(products.id)] as const;
  }
}

function searchClause(term: string | undefined): SQL | undefined {
  if (!term) return undefined;
  const pattern = `%${escapeIlike(term)}%`;
  return or(
    ilike(products.name, pattern),
    ilike(products.slug, pattern),
    ilike(products.shortDescription, pattern),
    ilike(products.description, pattern),
  );
}

function publicProductConditions(filters: PublicProductFilters, db: CatalogDb): SQL[] {
  const conditions: SQL[] = [eq(products.status, "active")];
  const search = searchClause(filters.search);
  if (search) conditions.push(search);
  if (filters.isNew) {
    conditions.push(gte(products.createdAt, newProductCutoff()));
  }
  if (filters.minPrice !== undefined) {
    conditions.push(sql`${products.basePrice} >= ${filters.minPrice}`);
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(sql`${products.basePrice} <= ${filters.maxPrice}`);
  }
  if (filters.categorySlug) {
    conditions.push(
      exists(
        db
          .select({ id: productCategories.productId })
          .from(productCategories)
          .innerJoin(categories, eq(categories.id, productCategories.categoryId))
          .where(
            and(
              eq(productCategories.productId, products.id),
              eq(categories.slug, filters.categorySlug),
            ),
          ),
      ),
    );
  }
  if (filters.dropSlug || filters.requireActiveDrop) {
    conditions.push(
      exists(
        db
          .select({ id: dropProducts.productId })
          .from(dropProducts)
          .innerJoin(drops, eq(drops.id, dropProducts.dropId))
          .where(
            and(
              eq(dropProducts.productId, products.id),
              eq(drops.status, "active"),
              filters.dropSlug ? eq(drops.slug, filters.dropSlug) : sql`true`,
            ),
          ),
      ),
    );
  }
  return conditions;
}

export async function listPublicProducts(filters: PublicProductFilters, db?: CatalogDb) {
  const client = catalogDb(db);
  const where = and(...publicProductConditions(filters, client));
  const offset = (filters.page - 1) * filters.pageSize;
  const order = sortExpression(filters.sort);

  const [rows, totals] = await Promise.all([
    client
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        shortDescription: products.shortDescription,
        basePrice: products.basePrice,
        compareAtPrice: products.compareAtPrice,
        createdAt: products.createdAt,
      })
      .from(products)
      .where(where)
      .orderBy(...order)
      .limit(filters.pageSize)
      .offset(offset),
    client.select({ value: count() }).from(products).where(where),
  ]);

  return { rows, total: Number(totals[0]?.value ?? 0) };
}

export async function listAdminProducts(filters: AdminProductFilters, db?: CatalogDb) {
  const client = catalogDb(db);
  const conditions: SQL[] = [];
  const search = searchClause(filters.search);
  if (search) conditions.push(search);
  if (filters.status) conditions.push(eq(products.status, filters.status));
  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (filters.page - 1) * filters.pageSize;
  const order = sortExpression(filters.sort);

  const [rows, totals] = await Promise.all([
    client
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        status: products.status,
        basePrice: products.basePrice,
        brand: products.brand,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(where)
      .orderBy(...order)
      .limit(filters.pageSize)
      .offset(offset),
    client.select({ value: count() }).from(products).where(where),
  ]);

  return { rows, total: Number(totals[0]?.value ?? 0) };
}

export async function findProductBySlug(slug: string, db?: CatalogDb) {
  const client = catalogDb(db);
  const [row] = await client.select().from(products).where(eq(products.slug, slug)).limit(1);
  return row ?? null;
}

export async function findProductById(id: string, db?: CatalogDb) {
  const client = catalogDb(db);
  const [row] = await client.select().from(products).where(eq(products.id, id)).limit(1);
  return row ?? null;
}

export async function insertProduct(
  values: typeof products.$inferInsert,
  db?: CatalogDb,
) {
  const client = catalogDb(db);
  const [row] = await client.insert(products).values(values).returning();
  return row;
}

export async function updateProductById(
  id: string,
  values: Partial<typeof products.$inferInsert>,
  db?: CatalogDb,
) {
  const client = catalogDb(db);
  const [row] = await client
    .update(products)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();
  return row ?? null;
}

export async function archiveProductById(id: string, db?: CatalogDb) {
  return updateProductById(id, { status: "archived" }, db);
}

export async function listImagesForProducts(productIds: string[], db?: CatalogDb) {
  if (productIds.length === 0) return [];
  const client = catalogDb(db);
  return client
    .select()
    .from(productImages)
    .where(inArray(productImages.productId, productIds))
    .orderBy(asc(productImages.sortOrder), asc(productImages.createdAt));
}

export async function listCategoriesForProducts(productIds: string[], db?: CatalogDb) {
  if (productIds.length === 0) return [];
  const client = catalogDb(db);
  return client
    .select({
      productId: productCategories.productId,
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
    })
    .from(productCategories)
    .innerJoin(categories, eq(categories.id, productCategories.categoryId))
    .where(inArray(productCategories.productId, productIds));
}

export async function listAvailabilityForProducts(productIds: string[], db?: CatalogDb) {
  if (productIds.length === 0) return [];
  const client = catalogDb(db);
  return client
    .select({
      productId: productVariants.productId,
      available: sql<boolean>`bool_or(${productVariants.isActive} and (${inventory.quantityOnHand} - ${inventory.quantityReserved}) > 0)`,
    })
    .from(productVariants)
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(inArray(productVariants.productId, productIds))
    .groupBy(productVariants.productId);
}

export async function listVariantCountsForProducts(productIds: string[], db?: CatalogDb) {
  if (productIds.length === 0) return [];
  const client = catalogDb(db);
  return client
    .select({
      productId: productVariants.productId,
      count: count(),
    })
    .from(productVariants)
    .where(inArray(productVariants.productId, productIds))
    .groupBy(productVariants.productId);
}

export async function countProductsByStatus(db?: CatalogDb) {
  const client = catalogDb(db);
  return client
    .select({
      status: products.status,
      value: count(),
    })
    .from(products)
    .groupBy(products.status);
}

export async function listVariantsWithAvailability(productId: string, db?: CatalogDb) {
  const client = catalogDb(db);
  return client
    .select({
      id: productVariants.id,
      sku: productVariants.sku,
      size: productVariants.size,
      color: productVariants.color,
      colorCode: productVariants.colorCode,
      price: productVariants.price,
      compareAtPrice: productVariants.compareAtPrice,
      isActive: productVariants.isActive,
      available: sql<boolean>`coalesce((${inventory.quantityOnHand} - ${inventory.quantityReserved}) > 0, false)`,
    })
    .from(productVariants)
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(eq(productVariants.productId, productId))
    .orderBy(asc(productVariants.size), asc(productVariants.sku));
}

export async function findPrimaryDropForProduct(productId: string, publicOnly: boolean, db?: CatalogDb) {
  const client = catalogDb(db);
  const [row] = await client
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
      displayOrder: dropProducts.displayOrder,
    })
    .from(dropProducts)
    .innerJoin(drops, eq(drops.id, dropProducts.dropId))
    .where(
      and(
        eq(dropProducts.productId, productId),
        publicOnly ? eq(drops.status, "active") : sql`true`,
      ),
    )
    .orderBy(asc(dropProducts.displayOrder))
    .limit(1);
  return row ?? null;
}

export async function listEditionsForProduct(productId: string, db?: CatalogDb) {
  const client = catalogDb(db);
  return client
    .select({
      editionNumber: productEditions.editionNumber,
      editionSize: productEditions.editionSize,
    })
    .from(productEditions)
    .where(eq(productEditions.productId, productId))
    .orderBy(asc(productEditions.editionNumber));
}

export async function findVariantById(id: string, db?: CatalogDb) {
  const client = catalogDb(db);
  const [row] = await client
    .select()
    .from(productVariants)
    .where(eq(productVariants.id, id))
    .limit(1);
  return row ?? null;
}

export async function insertVariant(
  values: typeof productVariants.$inferInsert,
  db?: CatalogDb,
) {
  const client = catalogDb(db);
  const [row] = await client.insert(productVariants).values(values).returning();
  return row;
}

export async function updateVariantById(
  id: string,
  values: Partial<typeof productVariants.$inferInsert>,
  db?: CatalogDb,
) {
  const client = catalogDb(db);
  const [row] = await client
    .update(productVariants)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(productVariants.id, id))
    .returning();
  return row ?? null;
}

export async function insertZeroInventory(variantId: string, db?: CatalogDb) {
  const client = catalogDb(db);
  await client
    .insert(inventory)
    .values({
      variantId,
      quantityOnHand: 0,
      quantityReserved: 0,
      quantitySold: 0,
      reorderLevel: 0,
    })
    .onConflictDoNothing();
}

export async function findImageById(id: string, db?: CatalogDb) {
  const client = catalogDb(db);
  const [row] = await client.select().from(productImages).where(eq(productImages.id, id)).limit(1);
  return row ?? null;
}

export async function insertImage(values: typeof productImages.$inferInsert, db?: CatalogDb) {
  const client = catalogDb(db);
  const [row] = await client.insert(productImages).values(values).returning();
  return row;
}

export async function updateImageById(
  id: string,
  values: Partial<typeof productImages.$inferInsert>,
  db?: CatalogDb,
) {
  const client = catalogDb(db);
  const [row] = await client
    .update(productImages)
    .set(values)
    .where(eq(productImages.id, id))
    .returning();
  return row ?? null;
}

export async function deleteImageById(id: string, db?: CatalogDb) {
  const client = catalogDb(db);
  await client.delete(productImages).where(eq(productImages.id, id));
}

export async function replaceProductCategories(
  productId: string,
  categoryIds: string[],
  db?: CatalogDb,
) {
  const client = catalogDb(db);
  await client.delete(productCategories).where(eq(productCategories.productId, productId));
  if (categoryIds.length === 0) return;
  await client.insert(productCategories).values(
    categoryIds.map((categoryId) => ({ productId, categoryId })),
  );
}

export async function findActiveCollectionBySlug(slug: string, db?: CatalogDb) {
  const client = catalogDb(db);
  const [row] = await client
    .select({ id: collections.id, slug: collections.slug, status: collections.status })
    .from(collections)
    .where(and(eq(collections.slug, slug), eq(collections.status, "active")))
    .limit(1);
  return row ?? null;
}
