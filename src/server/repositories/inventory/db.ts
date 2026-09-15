import { getDb } from "@/db";

type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export type InventoryDb = Db | Tx;

export function inventoryDb(db?: InventoryDb): InventoryDb {
  return db ?? getDb();
}
