import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { loadProjectEnv } from "@/lib/env/load";
import {
  requirePostgresConnectionString,
  runtimePostgresOptions,
} from "@/lib/env/postgres";

import {
  categories,
  dropProducts,
  drops,
  inventory,
  inventoryTransactions,
  productCategories,
  products,
  productVariants,
  collections,
} from "./schema";

const APPAREL_SIZES = [
  { size: "S", qty: 15 },
  { size: "M", qty: 45 },
  { size: "L", qty: 53 },
  { size: "XL", qty: 30 },
  { size: "XXL", qty: 7 },
] as const;

const COLOR = { name: "Black", code: "#050505", sku: "BLK" } as const;

type SeedProduct = {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: string;
  categorySlug: string;
  skuPrefix: string;
  kind: "apparel" | "cap";
};

const SEED_CATEGORIES = [
  { slug: "t-shirts", name: "T-Shirts", description: "Oversized and essential tees." },
  { slug: "hoodies", name: "Hoodies", description: "Heavyweight hoodies." },
  { slug: "overshirts", name: "Overshirts", description: "Layering overshirts." },
  { slug: "bottoms", name: "Bottoms", description: "Cargos and trousers." },
  { slug: "accessories", name: "Accessories", description: "Caps and finishing pieces." },
] as const;

const SEED_PRODUCTS: SeedProduct[] = [
  {
    slug: "the-builder-oversized-t-shirt",
    name: "The Builder Oversized T-Shirt",
    shortDescription: "Built from nothing. Worn as a statement.",
    description: "Oversized street tee from DROP 001 — THE BUILDER.",
    price: "1499.00",
    categorySlug: "t-shirts",
    skuPrefix: "THE-BUILDER-TEE",
    kind: "apparel",
  },
  {
    slug: "the-builder-heavyweight-hoodie",
    name: "The Builder Heavyweight Hoodie",
    shortDescription: "Heavyweight layer. Limited drop.",
    description: "Heavyweight hoodie from DROP 001 — THE BUILDER.",
    price: "2999.00",
    categorySlug: "hoodies",
    skuPrefix: "THE-BUILDER-HOODIE",
    kind: "apparel",
  },
  {
    slug: "the-builder-overshirt",
    name: "The Builder Overshirt",
    shortDescription: "Workwear cut. Builder identity.",
    description: "Overshirt from DROP 001 — THE BUILDER.",
    price: "2299.00",
    categorySlug: "overshirts",
    skuPrefix: "THE-BUILDER-OVERSHIRT",
    kind: "apparel",
  },
  {
    slug: "the-builder-cargo",
    name: "The Builder Cargo",
    shortDescription: "Utility cargo. Never restocked.",
    description: "Cargo from DROP 001 — THE BUILDER.",
    price: "1999.00",
    categorySlug: "bottoms",
    skuPrefix: "THE-BUILDER-CARGO",
    kind: "apparel",
  },
  {
    slug: "the-builder-cap",
    name: "The Builder Cap",
    shortDescription: "One size. One drop.",
    description: "Cap from DROP 001 — THE BUILDER.",
    price: "1199.00",
    categorySlug: "accessories",
    skuPrefix: "THE-BUILDER-CAP",
    kind: "cap",
  },
];

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

    const [collection] = await db
      .insert(collections)
      .values({
        name: "DROP 001 — THE BUILDER",
        slug: "the-builder",
        description: "BUILT FROM NOTHING.",
        status: "active",
        seoTitle: "DROP 001 — THE BUILDER",
        seoDescription: "The first MELKORAA collection. Built from nothing.",
      })
      .onConflictDoUpdate({
        target: collections.slug,
        set: {
          name: "DROP 001 — THE BUILDER",
          description: "BUILT FROM NOTHING.",
          status: "active",
          updatedAt: new Date(),
        },
      })
      .returning({ id: collections.id });

    if (!collection) {
      throw new Error("Failed to upsert collection");
    }

    const [drop] = await db
      .insert(drops)
      .values({
        name: "DROP 001 — THE BUILDER",
        slug: "drop-001",
        description: "DROP 001. THE BUILDER. BUILT FROM NOTHING.",
        status: "active",
        isLimited: true,
        isNeverRestocked: true,
      })
      .onConflictDoUpdate({
        target: drops.slug,
        set: {
          name: "DROP 001 — THE BUILDER",
          description: "DROP 001. THE BUILDER. BUILT FROM NOTHING.",
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

    let displayOrder = 0;
    for (const product of SEED_PRODUCTS) {
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
          seoTitle: `${product.name} — MELKORAA`,
          seoDescription: product.shortDescription,
        })
        .onConflictDoUpdate({
          target: products.slug,
          set: {
            name: product.name,
            shortDescription: product.shortDescription,
            description: product.description,
            status: "active",
            basePrice: product.price,
            updatedAt: new Date(),
          },
        })
        .returning({ id: products.id });

      if (!saved) {
        throw new Error(`Failed to upsert product ${product.slug}`);
      }

      const categoryId = categoryIds.get(product.categorySlug);
      if (!categoryId) {
        throw new Error(`Missing category ${product.categorySlug}`);
      }

      await db
        .insert(productCategories)
        .values({ productId: saved.id, categoryId })
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

      const variants =
        product.kind === "cap"
          ? [{ size: "ONE SIZE", qty: 150, skuSize: "OS" }]
          : APPAREL_SIZES.map((entry) => ({
              size: entry.size,
              qty: entry.qty,
              skuSize: entry.size,
            }));

      for (const variant of variants) {
        const sku = `${product.skuPrefix}-${COLOR.sku}-${variant.skuSize}`;
        const [savedVariant] = await db
          .insert(productVariants)
          .values({
            productId: saved.id,
            sku,
            size: variant.size,
            color: COLOR.name,
            colorCode: COLOR.code,
            price: product.price,
            isActive: true,
          })
          .onConflictDoUpdate({
            target: productVariants.sku,
            set: {
              size: variant.size,
              color: COLOR.name,
              colorCode: COLOR.code,
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

    void collection;
  } finally {
    await client.end();
  }
}

async function main() {
  loadProjectEnv();
  const databaseUrl = process.env.DATABASE_URL;
  await seedDatabase(requirePostgresConnectionString(databaseUrl, "DATABASE_URL"));
  console.info("Seed complete: DROP 001 catalog is upserted.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Seed failed");
  process.exit(1);
});
