import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

import { requireDirectDatabaseUrl } from "./src/lib/env/postgres";

loadEnvConfig(process.cwd());

/**
 * Drizzle Kit uses DIRECT_DATABASE_URL only (direct/session Postgres, port 5432).
 * It never falls back to DATABASE_URL. Application runtime uses DATABASE_URL
 * (transaction pooler, port 6543) via src/db/index.ts.
 */
function migrationConnectionUrl(): string {
  return requireDirectDatabaseUrl(process.env.DIRECT_DATABASE_URL);
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: migrationConnectionUrl(),
    ssl: "require",
  },
  strict: true,
  verbose: true,
});
