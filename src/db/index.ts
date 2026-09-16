import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { logger } from "@/lib/logger";
import { getServerEnv } from "@/lib/env/server";
import {
  assertRuntimeDatabaseUrl,
  requirePostgresConnectionString,
  runtimePostgresOptions,
} from "@/lib/env/postgres";
import * as schema from "./schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

let client: ReturnType<typeof postgres> | undefined;
let database: Database | undefined;
let loggedRuntimeTarget = false;

/**
 * Server-only Drizzle client singleton.
 * Uses DATABASE_URL (Supabase transaction pooler, port 6543) only.
 * Never reads DIRECT_DATABASE_URL — that URI is for Drizzle Kit migrations.
 * Call from repositories / services, never from Client Components.
 */
export function getDb(): Database {
  const env = getServerEnv();
  const url = requirePostgresConnectionString(env.DATABASE_URL, "DATABASE_URL");
  const target = assertRuntimeDatabaseUrl(url);

  if (!loggedRuntimeTarget) {
    loggedRuntimeTarget = true;
    const event = target.isTransactionPooler ? "db.runtime_pooler" : "db.runtime_pooler_misconfigured";
    const write = target.isTransactionPooler ? logger.info : logger.warn;
    write(event, {
      hostnameCategory: target.hostnameCategory,
      port: target.port,
      databaseName: target.databaseName,
      poolMax: target.poolMax,
      prepare: runtimePostgresOptions.prepare,
      ssl: "require",
    });
    if (!target.isTransactionPooler) {
      logger.warn("db.runtime_pooler_hint", {
        expectedHostnameCategory: "supabase-pooler",
        expectedPort: 6543,
        note: "Set DATABASE_URL to the Transaction pooler URI. The app does not rewrite .env.local.",
      });
    }
  }

  if (!client) {
    client = postgres(url, runtimePostgresOptions);
  }

  if (!database) {
    database = drizzle(client, { schema });
  }

  return database;
}
