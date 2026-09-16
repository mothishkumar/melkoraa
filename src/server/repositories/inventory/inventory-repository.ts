import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { inventory, inventoryTransactions, products, productVariants } from "@/db/schema";
import { loadPagedRows } from "@/db/paginate";
import { escapeIlike } from "@/lib/catalog/rules";
import type { InventorySort } from "@/lib/validation/inventory";
import { inventoryDb, type InventoryDb } from "@/server/repositories/inventory/db";

const availableSql = sql<number>`(${inventory.quantityOnHand} - ${inventory.quantityReserved})`;

function sortExpressions(sort: InventorySort) {
  switch (sort) {
    case "updated_asc":
      return [asc(inventory.updatedAt), asc(inventory.id)] as const;
    case "on_hand_desc":
      return [desc(inventory.quantityOnHand), asc(inventory.id)] as const;
    case "on_hand_asc":
      return [asc(inventory.quantityOnHand), asc(inventory.id)] as const;
    case "available_desc":
      return [desc(availableSql), asc(inventory.id)] as const;
    case "available_asc":
      return [asc(availableSql), asc(inventory.id)] as const;
    case "sku_asc":
      return [asc(productVariants.sku), asc(inventory.id)] as const;
    case "sku_desc":
      return [desc(productVariants.sku), asc(inventory.id)] as const;
    case "reserved_desc":
      return [desc(inventory.quantityReserved), asc(inventory.id)] as const;
    default:
      return [desc(inventory.updatedAt), asc(inventory.id)] as const;
  }
}

export type InventoryListFilters = {
  page: number;
  pageSize: number;
  search?: string;
  productId?: string;
  sku?: string;
  availability?: "in_stock" | "out_of_stock" | "low_stock";
  sort: InventorySort;
};

export async function findInventoryByVariantId(variantId: string, db?: InventoryDb) {
  const client = inventoryDb(db);
  const [row] = await client
    .select()
    .from(inventory)
    .where(eq(inventory.variantId, variantId))
    .limit(1);
  return row ?? null;
}

export async function findVariantSku(variantId: string, db?: InventoryDb) {
  const client = inventoryDb(db);
  const [row] = await client
    .select({
      id: productVariants.id,
      sku: productVariants.sku,
      size: productVariants.size,
      color: productVariants.color,
      productId: productVariants.productId,
      productName: products.name,
      productSlug: products.slug,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(eq(productVariants.id, variantId))
    .limit(1);
  return row ?? null;
}

export async function listInventory(filters: InventoryListFilters, db?: InventoryDb) {
  const client = inventoryDb(db);
  const conditions: SQL[] = [];

  if (filters.productId) {
    conditions.push(eq(productVariants.productId, filters.productId));
  }
  if (filters.sku) {
    conditions.push(eq(productVariants.sku, filters.sku));
  }
  if (filters.search) {
    const pattern = `%${escapeIlike(filters.search)}%`;
    const search = or(
      ilike(productVariants.sku, pattern),
      ilike(products.name, pattern),
      ilike(products.slug, pattern),
    );
    if (search) conditions.push(search);
  }
  if (filters.availability === "in_stock") {
    conditions.push(sql`${availableSql} > 0`);
  }
  if (filters.availability === "out_of_stock") {
    conditions.push(sql`${availableSql} <= 0`);
  }
  if (filters.availability === "low_stock") {
    conditions.push(sql`${availableSql} <= ${inventory.reorderLevel}`);
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (filters.page - 1) * filters.pageSize;
  const order = sortExpressions(filters.sort);

  return loadPagedRows(
    () =>
      client
        .select({
          id: inventory.id,
          variantId: inventory.variantId,
          quantityOnHand: inventory.quantityOnHand,
          quantityReserved: inventory.quantityReserved,
          quantitySold: inventory.quantitySold,
          reorderLevel: inventory.reorderLevel,
          updatedAt: inventory.updatedAt,
          sku: productVariants.sku,
          size: productVariants.size,
          color: productVariants.color,
          productId: productVariants.productId,
          productName: products.name,
          productSlug: products.slug,
        })
        .from(inventory)
        .innerJoin(productVariants, eq(productVariants.id, inventory.variantId))
        .innerJoin(products, eq(products.id, productVariants.productId))
        .where(where)
        .orderBy(...order)
        .limit(filters.pageSize)
        .offset(offset),
    () =>
      client
        .select({ value: count() })
        .from(inventory)
        .innerJoin(productVariants, eq(productVariants.id, inventory.variantId))
        .innerJoin(products, eq(products.id, productVariants.productId))
        .where(where),
  );
}

export async function insertInventory(
  values: typeof inventory.$inferInsert,
  db?: InventoryDb,
) {
  const client = inventoryDb(db);
  const [row] = await client.insert(inventory).values(values).returning();
  return row;
}

/**
 * Atomic on_hand change. Succeeds only if the next on_hand is >= 0 and >= reserved.
 */
export async function atomicAdjustOnHand(
  variantId: string,
  delta: number,
  db?: InventoryDb,
) {
  const client = inventoryDb(db);
  const [row] = await client
    .update(inventory)
    .set({
      quantityOnHand: sql`${inventory.quantityOnHand} + ${delta}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(inventory.variantId, variantId),
        sql`${inventory.quantityOnHand} + ${delta} >= 0`,
        sql`${inventory.quantityOnHand} + ${delta} >= ${inventory.quantityReserved}`,
      ),
    )
    .returning();
  return row ?? null;
}

/**
 * Atomic reserve. Succeeds only if on_hand - reserved >= quantity.
 */
export async function atomicReserve(variantId: string, quantity: number, db?: InventoryDb) {
  const client = inventoryDb(db);
  const [row] = await client
    .update(inventory)
    .set({
      quantityReserved: sql`${inventory.quantityReserved} + ${quantity}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(inventory.variantId, variantId),
        sql`${inventory.quantityOnHand} - ${inventory.quantityReserved} >= ${quantity}`,
      ),
    )
    .returning();
  return row ?? null;
}

export async function atomicRelease(variantId: string, quantity: number, db?: InventoryDb) {
  const client = inventoryDb(db);
  const [row] = await client
    .update(inventory)
    .set({
      quantityReserved: sql`${inventory.quantityReserved} - ${quantity}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(inventory.variantId, variantId),
        sql`${inventory.quantityReserved} >= ${quantity}`,
      ),
    )
    .returning();
  return row ?? null;
}

/**
 * Confirm sale: reserved decreases, sold increases, on_hand unchanged.
 */
export async function atomicConfirmSale(
  variantId: string,
  quantity: number,
  db?: InventoryDb,
) {
  const client = inventoryDb(db);
  const [row] = await client
    .update(inventory)
    .set({
      quantityReserved: sql`${inventory.quantityReserved} - ${quantity}`,
      quantitySold: sql`${inventory.quantitySold} + ${quantity}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(inventory.variantId, variantId),
        sql`${inventory.quantityReserved} >= ${quantity}`,
      ),
    )
    .returning();
  return row ?? null;
}

export async function insertLedger(
  values: typeof inventoryTransactions.$inferInsert,
  db?: InventoryDb,
) {
  const client = inventoryDb(db);
  const [row] = await client.insert(inventoryTransactions).values(values).returning();
  return row;
}

export async function listRecentTransactions(
  variantId: string,
  limit = 50,
  db?: InventoryDb,
) {
  const client = inventoryDb(db);
  return client
    .select()
    .from(inventoryTransactions)
    .where(eq(inventoryTransactions.variantId, variantId))
    .orderBy(desc(inventoryTransactions.createdAt))
    .limit(limit);
}

export async function countInventoryStates(db?: InventoryDb) {
  const client = inventoryDb(db);
  const [row] = await client
    .select({
      total: count(),
      outOfStock: sql<number>`coalesce(sum(case when (${inventory.quantityOnHand} - ${inventory.quantityReserved}) <= 0 then 1 else 0 end), 0)`,
      lowStock: sql<number>`coalesce(sum(case when (${inventory.quantityOnHand} - ${inventory.quantityReserved}) > 0 and (${inventory.quantityOnHand} - ${inventory.quantityReserved}) <= ${inventory.reorderLevel} then 1 else 0 end), 0)`,
      inStock: sql<number>`coalesce(sum(case when (${inventory.quantityOnHand} - ${inventory.quantityReserved}) > ${inventory.reorderLevel} then 1 else 0 end), 0)`,
    })
    .from(inventory);
  return {
    total: Number(row?.total ?? 0),
    outOfStock: Number(row?.outOfStock ?? 0),
    lowStock: Number(row?.lowStock ?? 0),
    inStock: Number(row?.inStock ?? 0),
  };
}

export async function listRecentLedger(limit = 12, db?: InventoryDb) {
  const client = inventoryDb(db);
  return client
    .select()
    .from(inventoryTransactions)
    .orderBy(desc(inventoryTransactions.createdAt))
    .limit(limit);
}
