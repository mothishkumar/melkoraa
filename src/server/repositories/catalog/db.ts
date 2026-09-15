import { getDb } from "@/db";

type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export type CatalogDb = Db | Tx;

export function catalogDb(db?: CatalogDb): CatalogDb {
  return db ?? getDb();
}
