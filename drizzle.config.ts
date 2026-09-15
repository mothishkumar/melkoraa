import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd());

function migrationConnectionUrl(): string {
  const url =
    process.env.DIRECT_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim() || "";

  if (!url) {
    throw new Error(
      "Missing DIRECT_DATABASE_URL / DATABASE_URL. Put the Supabase Postgres URIs in .env.local (direct URI for migrations, transaction pooler for runtime).",
    );
  }

  if (!url.startsWith("postgres://") && !url.startsWith("postgresql://")) {
    throw new Error(
      "DIRECT_DATABASE_URL (preferred) or DATABASE_URL must be a postgresql:// URI. The current value is not a Postgres connection string. Copy the URI from Supabase → Project Settings → Database (direct for DIRECT_DATABASE_URL, transaction pooler for DATABASE_URL). Do not paste secrets into chat.",
    );
  }

  return url;
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
