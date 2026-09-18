import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  DROP_001_COLORS,
  DROP_001_LEGACY_SLUGS,
  DROP_001_PRODUCTS,
  DROP_001_SIZES,
  drop001Sku,
} from "@/lib/catalog/drop-001";
import { loadProjectEnv } from "@/lib/env/load";
import {
  requirePostgresConnectionString,
  runtimePostgresOptions,
} from "@/lib/env/postgres";

import {
  categories,
  collections,
  dropProducts,
  drops,
  inventory,
  inventoryTransactions,
  productCategories,
  products,
  productVariants,
} from "./schema";

const SEED_CATEGORIES = [
  { slug: "t-shirts", name: "T-Shirts", description: "Oversized and essential tees." },
  { slug: "hoodies", name: "Hoodies", description: "Heavyweight hoodies." },
  { slug: "overshirts", name: "Overshirts", description: "Layering overshirts." },
  { slug: "bottoms", name: "Bottoms", description: "Cargos and trousers." },
  { slug: "accessories", name: "Accessories", description: "Caps and finishing pieces." },
] as const;

async function upsertCategory(
  db: ReturnType<typeof drizzle>,
  input: (typeof SEED_CATEGORIES)[number],
) {
  const [row] = await db
    .insert(categories)
    .values({
      name: input.name,
      slug: input.slug,
      description: input.description,
    })
    .onConflictDoUpdate({
      target: categories.slug,
      set: {
        name: input.name,
        description: input.description,
        updatedAt: new Date(),
      },
    })
    .returning({ id: categories.id });

  if (!row) {
    throw new Error(`Failed to upsert category ${input.slug}`);
  }

  return row.id;
}

export async function seedDatabase(connectionString: string) {
  const url = requirePostgresConnectionString(connectionString, "DATABASE_URL");
  const client = postgres(url, runtimePostgresOptions);
  const db = drizzle(client);

  try {
    const categoryIds = new Map<string, string>();
    for (const category of SEED_CATEGORIES) {
      categoryIds.set(category.slug, await upsertCategory(db, category));
    }

    const teeCategoryId = categoryIds.get("t-shirts");
    if (!teeCategoryId) {
      throw new Error("Missing t-shirts category");
    }

    await db
      .insert(collections)
      .values({
        name: "DROP 001 — THE BUILDER",
        slug: "the-builder",
        description: "Identity and manifesto oversized tees. People. Ideas. Progress. Together.",
        status: "active",
        seoTitle: "DROP 001 — THE BUILDER",
        seoDescription: "The first MELKORAA collection. Six production tees. Never restocked.",
      })
      .onConflictDoUpdate({
        target: collections.slug,
        set: {
          name: "DROP 001 — THE BUILDER",
          description: "Identity and manifesto oversized tees. People. Ideas. Progress. Together.",
          status: "active",
          seoTitle: "DROP 001 — THE BUILDER",
          seoDescription: "The first MELKORAA collection. Six production tees. Never restocked.",
          updatedAt: new Date(),
        },
      });

    const [drop] = await db
      .insert(drops)
      .values({
        name: "DROP 001 — THE BUILDER",
        slug: "drop-001",
        description:
          "DROP 001. THE BUILDER. Identity trio plus three manifesto graphics. Wear a higher standard.",
        status: "active",
        isLimited: true,
        isNeverRestocked: true,
      })
      .onConflictDoUpdate({
        target: drops.slug,
        set: {
          name: "DROP 001 — THE BUILDER",
          description:
            "DROP 001. THE BUILDER. Identity trio plus three manifesto graphics. Wear a higher standard.",
          status: "active",
          isLimited: true,
          isNeverRestocked: true,
          updatedAt: new Date(),
        },
      })
      .returning({ id: drops.id });

    if (!drop) {
      throw new Error("Failed to upsert drop");
    }

    const legacy = await db
      .select({ id: products.id })
      .from(products)
      .where(inArray(products.slug, [...DROP_001_LEGACY_SLUGS]));

    if (legacy.length > 0) {
      const legacyIds = legacy.map((row) => row.id);
      await db.delete(dropProducts).where(
        and(eq(dropProducts.dropId, drop.id), inArray(dropProducts.productId, legacyIds)),
      );
      await db
        .update(products)
        .set({ status: "archived", updatedAt: new Date() })
        .where(inArray(products.id, legacyIds));
    }

    let displayOrder = 0;
    for (const product of DROP_001_PRODUCTS) {
      const [saved] = await db
        .insert(products)
        .values({
          name: product.name,
          slug: product.slug,
          shortDescription: product.shortDescription,
          description: product.description,
          status: "active",
          basePrice: product.price,
          brand: "MELKORAA",
          seoTitle: `${product.name} — MELKORAA DROP 001`,
          seoDescription: product.tagline,
        })
        .onConflictDoUpdate({
          target: products.slug,
          set: {
            name: product.name,
            shortDescription: product.shortDescription,
            description: product.description,
            status: "active",
            basePrice: product.price,
            seoTitle: `${product.name} — MELKORAA DROP 001`,
            seoDescription: product.tagline,
            updatedAt: new Date(),
          },
        })
        .returning({ id: products.id });

      if (!saved) {
        throw new Error(`Failed to upsert product ${product.slug}`);
      }

      await db
        .insert(productCategories)
        .values({ productId: saved.id, categoryId: teeCategoryId })
        .onConflictDoNothing();

      await db
        .insert(dropProducts)
        .values({
          dropId: drop.id,
          productId: saved.id,
          displayOrder,
        })
        .onConflictDoUpdate({
          target: [dropProducts.dropId, dropProducts.productId],
          set: { displayOrder },
        });

      displayOrder += 1;

      for (const colorKey of product.colors) {
        const color = DROP_001_COLORS[colorKey];
        for (const variant of DROP_001_SIZES) {
          const sku = drop001Sku(product.skuPrefix, color.sku, variant.size);
          const [savedVariant] = await db
            .insert(productVariants)
            .values({
              productId: saved.id,
              sku,
              size: variant.size,
              color: color.name,
              colorCode: color.code,
              price: product.price,
              isActive: true,
            })
            .onConflictDoUpdate({
              target: productVariants.sku,
              set: {
                size: variant.size,
                color: color.name,
                colorCode: color.code,
                price: product.price,
                isActive: true,
                updatedAt: new Date(),
              },
            })
            .returning({ id: productVariants.id });

          if (!savedVariant) {
            throw new Error(`Failed to upsert variant ${sku}`);
          }

          await db
            .insert(inventory)
            .values({
              variantId: savedVariant.id,
              quantityOnHand: variant.qty,
              quantityReserved: 0,
              quantitySold: 0,
              reorderLevel: 0,
            })
            .onConflictDoUpdate({
              target: inventory.variantId,
              set: {
                quantityOnHand: variant.qty,
                quantityReserved: 0,
                reorderLevel: 0,
                updatedAt: new Date(),
              },
            });

          const existingSeedTxn = await db
            .select({ id: inventoryTransactions.id })
            .from(inventoryTransactions)
            .where(
              and(
                eq(inventoryTransactions.variantId, savedVariant.id),
                eq(inventoryTransactions.referenceType, "seed"),
              ),
            )
            .limit(1);

          if (existingSeedTxn.length === 0) {
            await db.insert(inventoryTransactions).values({
              variantId: savedVariant.id,
              transactionType: "purchase",
              quantity: variant.qty,
              referenceType: "seed",
              referenceId: savedVariant.id,
              notes: "Initial DROP 001 seed inventory",
            });
          }
        }
      }
    }
  } finally {
    await client.end();
  }
}

async function main() {
  loadProjectEnv();
  const databaseUrl = process.env.DATABASE_URL;
  await seedDatabase(requirePostgresConnectionString(databaseUrl, "DATABASE_URL"));
  console.info("Seed complete: DROP 001 production tees are upserted.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Seed failed");
  process.exit(1);
});
