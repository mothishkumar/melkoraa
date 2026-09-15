import { getDb } from "@/db";
import { logger } from "@/lib/logger";
import { isUniqueViolation } from "@/server/api";
import {
  conflictError,
  notFoundError,
  unprocessableError,
} from "@/server/errors";
import { paginationMeta } from "@/server/http";
import * as inventoryRepo from "@/server/repositories/inventory/inventory-repository";
import type { InventoryDb } from "@/server/repositories/inventory/db";
import {
  mapLedger,
  mapListItem,
  mapSnapshot,
} from "@/server/services/inventory/mappers";
import type { InventorySort } from "@/lib/validation/inventory";

type MutationMeta = {
  notes?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  actorId: string;
};

async function requireVariant(variantId: string, db?: InventoryDb) {
  const variant = await inventoryRepo.findVariantSku(variantId, db);
  if (!variant) {
    throw notFoundError("VARIANT_NOT_FOUND", "Variant not found");
  }
  return variant;
}

async function requireInventory(variantId: string, db?: InventoryDb) {
  const row = await inventoryRepo.findInventoryByVariantId(variantId, db);
  if (!row) {
    throw notFoundError("INVENTORY_NOT_FOUND", "Inventory was not found for this variant.");
  }
  return row;
}

export async function listAdminInventory(query: {
  page: number;
  pageSize: number;
  search?: string;
  productId?: string;
  sku?: string;
  availability?: "in_stock" | "out_of_stock" | "low_stock";
  sort: InventorySort;
}) {
  const { rows, total } = await inventoryRepo.listInventory(query);
  return {
    data: rows.map(mapListItem),
    pagination: paginationMeta(query.page, query.pageSize, total),
  };
}

export async function getAdminInventory(variantId: string) {
  const variant = await requireVariant(variantId);
  const row = await requireInventory(variantId);
  const transactions = await inventoryRepo.listRecentTransactions(variantId);
  return {
    ...mapListItem({
      ...row,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      productId: variant.productId,
      productName: variant.productName,
      productSlug: variant.productSlug,
    }),
    recentTransactions: transactions.map(mapLedger),
  };
}

export async function initializeInventory(
  input: {
    variantId: string;
    onHand?: number;
    reorderLevel?: number;
    notes?: string | null;
  },
  actorId: string,
) {
  await requireVariant(input.variantId);
  const onHand = input.onHand ?? 0;
  const db = getDb();

  try {
    const created = await db.transaction(async (tx) => {
      const row = await inventoryRepo.insertInventory(
        {
          variantId: input.variantId,
          quantityOnHand: onHand,
          quantityReserved: 0,
          quantitySold: 0,
          reorderLevel: input.reorderLevel ?? 0,
        },
        tx,
      );
      if (onHand > 0) {
        await inventoryRepo.insertLedger(
          {
            variantId: input.variantId,
            transactionType: "purchase",
            quantity: onHand,
            referenceType: "initialize",
            notes: input.notes ?? "Inventory initialized",
          },
          tx,
        );
      }
      return row;
    });
    logger.info("inventory.initialized", { actorId, resourceId: input.variantId });
    return mapSnapshot(created);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflictError(
        "INVENTORY_CONFLICT",
        "Inventory already exists for this variant.",
      );
    }
    throw error;
  }
}

async function mutate(
  variantId: string,
  actorId: string,
  operation: string,
  run: (tx: InventoryDb) => Promise<{
    row: NonNullable<Awaited<ReturnType<typeof inventoryRepo.findInventoryByVariantId>>>;
    ledger: Parameters<typeof inventoryRepo.insertLedger>[0];
  }>,
  db?: InventoryDb,
) {
  const apply = async (tx: InventoryDb) => {
    await requireVariant(variantId, tx);
    await requireInventory(variantId, tx);
    const { row, ledger } = await run(tx);
    await inventoryRepo.insertLedger(ledger, tx);
    return row;
  };

  // Checkout passes its outer transaction so reserve/release share one commit.
  // Admin APIs keep the existing per-call transaction (no nested txs).
  const result = db ? await apply(db) : await getDb().transaction(apply);
  logger.info(operation, { actorId, resourceId: variantId });
  return mapSnapshot(result);
}

export async function adjustInventory(
  variantId: string,
  delta: number,
  meta: MutationMeta,
  db?: InventoryDb,
) {
  return mutate(variantId, meta.actorId, "inventory.adjusted", async (tx) => {
    const row = await inventoryRepo.atomicAdjustOnHand(variantId, delta, tx);
    if (!row) {
      throw unprocessableError(
        "INVENTORY_CONFLICT",
        "This adjustment would make on-hand negative or below reserved quantity.",
      );
    }
    return {
      row,
      ledger: {
        variantId,
        transactionType: "adjustment" as const,
        quantity: delta,
        referenceType: meta.referenceType ?? null,
        referenceId: meta.referenceId ?? null,
        notes: meta.notes ?? null,
      },
    };
  }, db);
}

export async function reserveInventory(
  variantId: string,
  quantity: number,
  meta: MutationMeta,
  db?: InventoryDb,
) {
  return mutate(variantId, meta.actorId, "inventory.reserved", async (tx) => {
    const row = await inventoryRepo.atomicReserve(variantId, quantity, tx);
    if (!row) {
      throw conflictError(
        "INSUFFICIENT_STOCK",
        "Not enough available stock to reserve.",
      );
    }
    return {
      row,
      ledger: {
        variantId,
        transactionType: "reservation" as const,
        quantity,
        referenceType: meta.referenceType ?? null,
        referenceId: meta.referenceId ?? null,
        notes: meta.notes ?? null,
      },
    };
  }, db);
}

export async function releaseInventory(
  variantId: string,
  quantity: number,
  meta: MutationMeta,
  db?: InventoryDb,
) {
  return mutate(variantId, meta.actorId, "inventory.released", async (tx) => {
    const row = await inventoryRepo.atomicRelease(variantId, quantity, tx);
    if (!row) {
      throw unprocessableError(
        "INVENTORY_CONFLICT",
        "Cannot release more units than are currently reserved.",
      );
    }
    return {
      row,
      ledger: {
        variantId,
        transactionType: "release" as const,
        quantity,
        referenceType: meta.referenceType ?? null,
        referenceId: meta.referenceId ?? null,
        notes: meta.notes ?? null,
      },
    };
  }, db);
}

export async function confirmInventorySale(
  variantId: string,
  quantity: number,
  meta: MutationMeta,
  db?: InventoryDb,
) {
  return mutate(variantId, meta.actorId, "inventory.sale_confirmed", async (tx) => {
    const row = await inventoryRepo.atomicConfirmSale(variantId, quantity, tx);
    if (!row) {
      throw unprocessableError(
        "INVENTORY_CONFLICT",
        "Cannot confirm a sale for more units than are currently reserved.",
      );
    }
    return {
      row,
      ledger: {
        variantId,
        transactionType: "sale" as const,
        quantity,
        referenceType: meta.referenceType ?? null,
        referenceId: meta.referenceId ?? null,
        notes: meta.notes ?? null,
      },
    };
  }, db);
}
