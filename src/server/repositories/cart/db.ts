import { getDb } from "@/db";

type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export type CartDb = Db | Tx;

export function cartDb(db?: CartDb): CartDb {
  return db ?? getDb();
}
