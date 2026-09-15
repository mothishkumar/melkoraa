import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getServerEnv } from "@/lib/env/server";
import * as schema from "./schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

let client: ReturnType<typeof postgres> | undefined;
let database: Database | undefined;

/**
 * Server-only Drizzle client.
 * Call from repositories / services, never from Client Components.
 */
export function getDb(): Database {
  const env = getServerEnv();

  if (!client) {
    client = postgres(env.DATABASE_URL, {
      prepare: false,
      max: 1,
    });
  }

  if (!database) {
    database = drizzle(client, { schema });
  }

  return database;
}
