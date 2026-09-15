import { defineConfig } from "drizzle-kit";

/**
 * Drizzle is configured for Supabase PostgreSQL.
 * Schema modules will be added in a later phase.
 * Never apply destructive migrations automatically.
 */
export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
