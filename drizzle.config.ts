import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

import { requirePostgresConnectionString } from "./src/lib/env/postgres";

loadEnvConfig(process.cwd());

function migrationConnectionUrl(): string {
  const url =
    process.env.DIRECT_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim() || "";

  return requirePostgresConnectionString(
    url,
    process.env.DIRECT_DATABASE_URL?.trim() ? "DIRECT_DATABASE_URL" : "DATABASE_URL",
  );
}

/**
 * Drizzle Kit uses DIRECT_DATABASE_URL (session/direct Postgres) when set.
 * Application runtime uses DATABASE_URL (transaction pooler) via src/db/index.ts.
 */
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
