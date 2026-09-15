import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getServerEnv } from "@/lib/env/server";
import {
  requirePostgresConnectionString,
  runtimePostgresOptions,
} from "@/lib/env/postgres";
import * as schema from "./schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

let client: ReturnType<typeof postgres> | undefined;
let database: Database | undefined;

/**
 * Server-only Drizzle client.
 * Uses DATABASE_URL (transaction pooler when configured).
 * Call from repositories / services, never from Client Components.
 */
export function getDb(): Database {
  const env = getServerEnv();
  const url = requirePostgresConnectionString(env.DATABASE_URL, "DATABASE_URL");

  if (!client) {
    client = postgres(url, runtimePostgresOptions);
  }

  if (!database) {
    database = drizzle(client, { schema });
  }

  return database;
}
