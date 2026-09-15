import { defineConfig } from "drizzle-kit";

/**
 * Drizzle is configured for Supabase PostgreSQL.
 * Generate with `npm run db:generate`, review SQL, then `npm run db:migrate`.
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
