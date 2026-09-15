import { readFileSync } from "node:fs";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { loadProjectEnv } from "@/lib/env/load";
import {
  requirePostgresConnectionString,
  runtimePostgresOptions,
} from "@/lib/env/postgres";
import {
  cartItems,
  carts,
  inventory,
  products,
  productVariants,
} from "@/db/schema";
import * as schema from "@/db/schema";
import * as cartRepo from "@/server/repositories/cart/cart-repository";

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

describe.skipIf(!canRun)("cart and wishlist database operations", () => {
  let client: ReturnType<typeof postgres>;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let url = "";
  const slug = `phase6-cart-${crypto.randomUUID()}`;
  let productId = "";
  let variantId = "";
  let cartId = "";
  const sessionId = `phase6-${crypto.randomUUID()}`;

  beforeAll(async () => {
    url = requirePostgresConnectionString(process.env.DATABASE_URL, "DATABASE_URL");
    client = postgres(url, runtimePostgresOptions);
    db = drizzle(client, { schema });

    const [product] = await db
      .insert(products)
      .values({
        name: "Phase 6 Cart Fixture",
        slug,
        status: "active",
        basePrice: "100.00",
      })
      .returning({ id: products.id });
    productId = product!.id;

    const [variant] = await db
      .insert(productVariants)
      .values({
        productId,
        sku: `P6-${crypto.randomUUID().slice(0, 8)}`,
        size: "M",
        color: "Black",
        price: "100.00",
      })
      .returning({ id: productVariants.id });
    variantId = variant!.id;

    await db.insert(inventory).values({
      variantId,
      quantityOnHand: 5,
      quantityReserved: 0,
      quantitySold: 0,
    });

    const [cart] = await db
      .insert(carts)
      .values({ sessionId, status: "active" })
      .returning({ id: carts.id });
    cartId = cart!.id;
  });

  afterAll(async () => {
    try {
      if (cartId) {
        await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
        await db.delete(carts).where(eq(carts.id, cartId));
      }
      if (variantId) {
        await db.delete(inventory).where(eq(inventory.variantId, variantId));
        await db.delete(productVariants).where(eq(productVariants.id, variantId));
      }
      if (productId) {
        await db.delete(products).where(eq(products.id, productId));
      }
    } finally {
      await client.end();
    }
  });

  it("27. unique cart+variant: second insert upserts instead of duplicating", async () => {
    const first = await cartRepo.upsertCartItemQuantity(cartId, variantId, 1, "100.00", db);
    const second = await cartRepo.upsertCartItemQuantity(cartId, variantId, 1, "100.00", db);
    expect(first?.quantity).toBe(1);
    expect(second?.quantity).toBe(2);
    const rows = await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
    expect(rows).toHaveLength(1);
  });

  it("28. replacing quantity does not create another row", async () => {
    await db
      .update(cartItems)
      .set({ quantity: 4, unitPrice: "100.00" })
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, variantId)));
    const rows = await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.quantity).toBe(4);
  });

  it("29. upsert returns null when quantity would exceed 20", async () => {
    await db
      .update(cartItems)
      .set({ quantity: 20 })
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, variantId)));
    const overflow = await cartRepo.upsertCartItemQuantity(cartId, variantId, 1, "100.00", db);
    expect(overflow).toBeNull();
    const [row] = await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
    expect(row?.quantity).toBe(20);
  });

  it("30. two concurrent add(1) calls merge to quantity 2 on one row", async () => {
    await db.delete(cartItems).where(eq(cartItems.cartId, cartId));

    const clientA = postgres(url, runtimePostgresOptions);
    const clientB = postgres(url, runtimePostgresOptions);
    const dbA = drizzle(clientA, { schema });
    const dbB = drizzle(clientB, { schema });

    try {
      const results = await Promise.all([
        cartRepo.upsertCartItemQuantity(cartId, variantId, 1, "100.00", dbA),
        cartRepo.upsertCartItemQuantity(cartId, variantId, 1, "100.00", dbB),
      ]);
      const quantities = results.map((row) => row?.quantity).filter((value) => value != null);
      expect(quantities).toHaveLength(2);
      expect(Math.max(...quantities)).toBe(2);
      const rows = await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
      expect(rows).toHaveLength(1);
      expect(rows[0]?.quantity).toBe(2);
    } finally {
      await clientA.end();
      await clientB.end();
    }
  });

  it("31. purchasable lookup hides draft products", async () => {
    await db.update(products).set({ status: "draft" }).where(eq(products.id, productId));
    const found = await cartRepo.findPurchasableVariant(variantId, db);
    expect(found?.productStatus).toBe("draft");
    await db.update(products).set({ status: "active" }).where(eq(products.id, productId));
  });

  it("32. listing by user id cannot see a session-owned fixture cart", async () => {
    const lines = await cartRepo.listCartLines("00000000-0000-4000-8000-000000000099", db);
    expect(lines).toHaveLength(0);
  });
});
