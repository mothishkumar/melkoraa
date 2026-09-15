import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { inventoryTransactionTypeEnum } from "./enums";
import { createdAtCol, updatedAtCol, uuidPkCol } from "./helpers";
import { productVariants } from "./catalog";

export const inventory = pgTable(
  "inventory",
  {
    id: uuidPkCol(),
    variantId: uuid("variant_id").notNull(),
    quantityOnHand: integer("quantity_on_hand").notNull().default(0),
    quantityReserved: integer("quantity_reserved").notNull().default(0),
    quantitySold: integer("quantity_sold").notNull().default(0),
    reorderLevel: integer("reorder_level").notNull().default(0),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (table) => [
    foreignKey({
      columns: [table.variantId],
      foreignColumns: [productVariants.id],
      name: "inventory_variant_id_fkey",
    }).onDelete("restrict"),
    uniqueIndex("inventory_variant_id_uidx").on(table.variantId),
    check("inventory_on_hand_non_negative", sql`${table.quantityOnHand} >= 0`),
    check("inventory_reserved_non_negative", sql`${table.quantityReserved} >= 0`),
    check("inventory_sold_non_negative", sql`${table.quantitySold} >= 0`),
    check("inventory_reorder_non_negative", sql`${table.reorderLevel} >= 0`),
    check(
      "inventory_reserved_not_gt_on_hand",
      sql`${table.quantityReserved} <= ${table.quantityOnHand}`,
    ),
  ],
).enableRLS();

export const inventoryTransactions = pgTable(
  "inventory_transactions",
  {
    id: uuidPkCol(),
    variantId: uuid("variant_id").notNull(),
    transactionType: inventoryTransactionTypeEnum("transaction_type").notNull(),
    quantity: integer("quantity").notNull(),
    referenceType: text("reference_type"),
    referenceId: uuid("reference_id"),
    notes: text("notes"),
    createdAt: createdAtCol(),
  },
  (table) => [
    foreignKey({
      columns: [table.variantId],
      foreignColumns: [productVariants.id],
      name: "inventory_transactions_variant_id_fkey",
    }).onDelete("restrict"),
    index("inventory_transactions_variant_created_idx").on(
      table.variantId,
      table.createdAt,
    ),
    check("inventory_transactions_quantity_nonzero", sql`${table.quantity} <> 0`),
  ],
).enableRLS();
