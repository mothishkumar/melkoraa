import { readFileSync } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { loadProjectEnv } from "@/lib/env/load";
import {
  requirePostgresConnectionString,
  runtimePostgresOptions,
} from "@/lib/env/postgres";
import {
  inventory,
  inventoryTransactions,
  products,
  productVariants,
} from "@/db/schema";
import * as schema from "@/db/schema";
import {
  atomicConfirmSale,
  atomicRelease,
  atomicReserve,
  findInventoryByVariantId,
  insertInventory,
  insertLedger,
} from "@/server/repositories/inventory/inventory-repository";

function ensureDatabaseUrl(): string {
  loadProjectEnv();
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  try {
    const envFile = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    const line = envFile.split(/\r?\n/).find((entry) => entry.startsWith("DATABASE_URL="));
    if (!line) return "";
    let value = line.slice("DATABASE_URL=".length).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env.DATABASE_URL = value;
    return value;
  } catch {
    return "";
  }
}

const databaseUrl = ensureDatabaseUrl();
const canRun =
  databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://");

describe.skipIf(!canRun)("inventory database operations", () => {
  let client: ReturnType<typeof postgres>;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let url = "";
  const slug = `phase5-inv-${crypto.randomUUID()}`;
  let variantId = "";
  let productId = "";
  const extraVariantIds: string[] = [];

  beforeAll(async () => {
    url = requirePostgresConnectionString(process.env.DATABASE_URL, "DATABASE_URL");
    client = postgres(url, runtimePostgresOptions);
    db = drizzle(client, { schema });

    const [product] = await db
      .insert(products)
      .values({
        name: "Phase 5 Inventory Fixture",
        slug,
        status: "draft",
        basePrice: "100.00",
      })
      .returning({ id: products.id });
    productId = product!.id;

    const [variant] = await db
      .insert(productVariants)
      .values({
        productId,
        sku: `P5-${crypto.randomUUID().slice(0, 8)}`,
        size: "M",
        color: "Black",
        price: "100.00",
      })
      .returning({ id: productVariants.id });
    variantId = variant!.id;
  });

  afterAll(async () => {
    try {
      const variantIds = [variantId, ...extraVariantIds].filter(Boolean);
      for (const id of variantIds) {
        await db
          .delete(inventoryTransactions)
          .where(eq(inventoryTransactions.variantId, id));
        await db.delete(inventory).where(eq(inventory.variantId, id));
        await db.delete(productVariants).where(eq(productVariants.id, id));
      }
      if (productId) {
        await db.delete(products).where(eq(products.id, productId));
      }
    } finally {
      await client.end();
    }
  });

  it("18. initialize is unique per variant; reserve/release/confirm are atomic", async () => {
    await insertInventory(
      {
        variantId,
        quantityOnHand: 5,
        quantityReserved: 0,
        quantitySold: 0,
        reorderLevel: 0,
      },
      db,
    );

    await expect(
      insertInventory(
        {
          variantId,
          quantityOnHand: 1,
          quantityReserved: 0,
          quantitySold: 0,
        },
        db,
      ),
    ).rejects.toBeTruthy();

    const reserved = await db.transaction(async (tx) => {
      const row = await atomicReserve(variantId, 2, tx);
      await insertLedger(
        {
          variantId,
          transactionType: "reservation",
          quantity: 2,
          notes: "test reserve",
        },
        tx,
      );
      return row;
    });
    expect(reserved?.quantityReserved).toBe(2);
    expect(reserved?.quantityOnHand).toBe(5);

    expect(await atomicReserve(variantId, 4, db)).toBeNull();

    const released = await atomicRelease(variantId, 1, db);
    expect(released?.quantityReserved).toBe(1);
    expect(released?.quantityOnHand).toBe(5);

    const sold = await atomicConfirmSale(variantId, 1, db);
    expect(sold?.quantityReserved).toBe(0);
    expect(sold?.quantitySold).toBe(1);
    expect(sold?.quantityOnHand).toBe(5);

    const remaining = await findInventoryByVariantId(variantId, db);
    expect(remaining).toMatchObject({
      quantityOnHand: 5,
      quantityReserved: 0,
      quantitySold: 1,
    });
  });

  it("19. two concurrent reserve(1) calls on on_hand=1 cannot oversell", async () => {
    const [variant] = await db
      .insert(productVariants)
      .values({
        productId,
        sku: `P5C-${crypto.randomUUID().slice(0, 8)}`,
        size: "L",
        color: "Black",
        price: "100.00",
      })
      .returning({ id: productVariants.id });
    const concurrentVariantId = variant!.id;
    extraVariantIds.push(concurrentVariantId);

    await insertInventory(
      {
        variantId: concurrentVariantId,
        quantityOnHand: 1,
        quantityReserved: 0,
        quantitySold: 0,
      },
      db,
    );

    const clientA = postgres(url, runtimePostgresOptions);
    const clientB = postgres(url, runtimePostgresOptions);
    const dbA = drizzle(clientA, { schema });
    const dbB = drizzle(clientB, { schema });

    try {
      const results = await Promise.all([
        atomicReserve(concurrentVariantId, 1, dbA),
        atomicReserve(concurrentVariantId, 1, dbB),
      ]);
      const succeeded = results.filter(Boolean);
      const failed = results.filter((row) => row === null);
      expect(succeeded).toHaveLength(1);
      expect(failed).toHaveLength(1);
      expect(succeeded[0]?.quantityReserved).toBe(1);
      expect(succeeded[0]?.quantityOnHand).toBe(1);
    } finally {
      await clientA.end();
      await clientB.end();
    }
  });

  it("21. ledger failure rolls back the inventory UPDATE in the same transaction", async () => {
    const [variant] = await db
      .insert(productVariants)
      .values({
        productId,
        sku: `P5R-${crypto.randomUUID().slice(0, 8)}`,
        size: "S",
        color: "Black",
        price: "100.00",
      })
      .returning({ id: productVariants.id });
    const rollbackVariantId = variant!.id;
    extraVariantIds.push(rollbackVariantId);

    await insertInventory(
      {
        variantId: rollbackVariantId,
        quantityOnHand: 3,
        quantityReserved: 0,
        quantitySold: 0,
      },
      db,
    );

    await expect(
      db.transaction(async (tx) => {
        const row = await atomicReserve(rollbackVariantId, 1, tx);
        expect(row?.quantityReserved).toBe(1);
        await insertLedger(
          {
            variantId: rollbackVariantId,
            transactionType: "reservation",
            quantity: 0,
            notes: "illegal zero quantity must abort",
          },
          tx,
        );
      }),
    ).rejects.toBeTruthy();

    const remaining = await findInventoryByVariantId(rollbackVariantId, db);
    expect(remaining).toMatchObject({
      quantityOnHand: 3,
      quantityReserved: 0,
      quantitySold: 0,
    });
  });
});
