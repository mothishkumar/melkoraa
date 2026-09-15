import { getDb } from "@/db";

type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export type OrderDb = Db | Tx;

export function orderDb(db?: OrderDb): OrderDb {
  return db ?? getDb();
}
