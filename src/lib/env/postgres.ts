const DEFAULT_POOL_MAX = 4;
const TEST_POOL_MAX = 1;
const ABSOLUTE_POOL_CEILING = 8;
export const TRANSACTION_POOLER_PORT = 6543;
export const DIRECT_POSTGRES_PORT = 5432;

export type PostgresHostnameCategory =
  | "supabase-pooler"
  | "supabase-direct-db"
  | "supabase-other"
  | "literal-postgres"
  | "localhost"
  | "other"
  | "missing";

export type SafePostgresTarget = {
  hostnameCategory: PostgresHostnameCategory;
  port: number;
  databaseName: string;
  poolMax: number;
  isTransactionPooler: boolean;
  isDirectSession: boolean;
};

/**
 * Runtime postgres.js pool size for DATABASE_URL (Supabase transaction pooler).
 * Tests stay at 1 so existing integration clients remain conservative.
 * Production default is 4 per Node isolate — enough for concurrent catalog
 * requests on a long-lived instance, small enough for Vercel+pooler.
 */
export function resolvePostgresPoolMax(
  raw = process.env.POSTGRES_POOL_MAX,
  env: Record<string, string | undefined> = process.env,
): number {
  const isTest = env.VITEST === "true" || env.NODE_ENV === "test";
  if (isTest && (raw === undefined || raw.trim() === "")) {
    return TEST_POOL_MAX;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return isTest ? TEST_POOL_MAX : DEFAULT_POOL_MAX;
  }
  return Math.min(parsed, ABSOLUTE_POOL_CEILING);
}

export const runtimePostgresOptions = {
  prepare: false,
  ssl: "require" as const,
  max: resolvePostgresPoolMax(),
  idle_timeout: 20,
  connect_timeout: 10,
};

export function isPostgresConnectionString(value: string): boolean {
  return value.startsWith("postgres://") || value.startsWith("postgresql://");
}

/**
 * Supabase URI copies sometimes wrap hostnames in IPv6 brackets, and
 * passwords often contain reserved characters that must be percent-encoded.
 */
export function normalizePostgresConnectionString(value: string): string {
  const trimmed = value.trim().replace(/@\[([^\]:]+)\]:/g, "@$1:");
  return encodePostgresUserinfo(trimmed);
}

function encodePostgresUserinfo(url: string): string {
  const schemeMatch = /^(postgres(?:ql)?:\/\/)/.exec(url);
  if (!schemeMatch) {
    return url;
  }

  const scheme = schemeMatch[1];
  const rest = url.slice(scheme.length);
  const at = rest.lastIndexOf("@");
  if (at <= 0) {
    return url;
  }

  const userinfo = rest.slice(0, at);
  const hostAndPath = rest.slice(at + 1);
  const colon = userinfo.indexOf(":");
  if (colon === -1) {
    return url;
  }

  const user = userinfo.slice(0, colon);
  const rawPassword = userinfo.slice(colon + 1);
  let password = rawPassword;
  try {
    password = decodeURIComponent(rawPassword);
  } catch {
    password = rawPassword;
  }

  return `${scheme}${user}:${encodeURIComponent(password)}@${hostAndPath}`;
}

export function requirePostgresConnectionString(
  value: string | undefined,
  name: string,
): string {
  if (!value || value.trim().length === 0) {
    throw new Error(
      `${name} is missing. Set it in .env.local to a PostgreSQL URI from the Supabase database settings.`,
    );
  }

  const normalized = normalizePostgresConnectionString(value);

  if (!isPostgresConnectionString(normalized)) {
    throw new Error(
      `${name} must be a PostgreSQL URI (postgresql://...), not an HTTP URL. Use the Supabase connection string (transaction pooler for DATABASE_URL, direct for DIRECT_DATABASE_URL).`,
    );
  }

  return normalized;
}

export function classifyPostgresHostname(hostname: string): PostgresHostnameCategory {
  const host = hostname.trim().toLowerCase();
  if (!host) return "missing";
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") return "localhost";
  if (host === "postgres") return "literal-postgres";
  if (host.includes("pooler") && host.includes("supabase")) return "supabase-pooler";
  if (host.startsWith("db.") && host.includes("supabase")) return "supabase-direct-db";
  if (host.includes("supabase")) return "supabase-other";
  return "other";
}

/**
 * Safe connection metadata for logs and errors. Never includes username, password, or the URI.
 */
export function describePostgresTarget(
  url: string,
  poolMax = resolvePostgresPoolMax(),
  name = "DATABASE_URL",
): SafePostgresTarget {
  const normalized = requirePostgresConnectionString(url, name);
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error("PostgreSQL URI could not be parsed. Check DATABASE_URL / DIRECT_DATABASE_URL formatting.");
  }

  const port = parsed.port
    ? Number(parsed.port)
    : parsed.protocol === "postgres:" || parsed.protocol === "postgresql:"
      ? DIRECT_POSTGRES_PORT
      : Number.NaN;
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, "").split("/")[0] ?? "").trim();
  const hostnameCategory = classifyPostgresHostname(parsed.hostname);
  const isTransactionPooler =
    port === TRANSACTION_POOLER_PORT && hostnameCategory !== "supabase-direct-db";
  const isDirectSession =
    port === DIRECT_POSTGRES_PORT && hostnameCategory !== "supabase-pooler";

  return {
    hostnameCategory,
    port,
    databaseName: databaseName.length > 0 ? databaseName : "(missing)",
    poolMax,
    isTransactionPooler,
    isDirectSession,
  };
}

export function formatSafePostgresTarget(target: SafePostgresTarget): string {
  return `hostnameCategory=${target.hostnameCategory} port=${target.port} databaseName=${target.databaseName} poolMax=${target.poolMax}`;
}

function misconfigMode(
  env: Record<string, string | undefined> = process.env,
): "throw" | "warn" {
  return env.NODE_ENV === "production" ? "throw" : "warn";
}

/**
 * Runtime must be the Supabase transaction pooler (port 6543), not the direct db host (5432).
 * Production refuses a misconfigured URI. Development/test warn so local env can be updated separately.
 */
export function assertRuntimeDatabaseUrl(
  url: string,
  env: Record<string, string | undefined> = process.env,
  poolMax = resolvePostgresPoolMax(env.POSTGRES_POOL_MAX, env),
): SafePostgresTarget {
  const target = describePostgresTarget(url, poolMax);
  const problems: string[] = [];
  if (target.port !== TRANSACTION_POOLER_PORT) {
    problems.push(`expected port ${TRANSACTION_POOLER_PORT} (transaction pooler)`);
  }
  if (target.hostnameCategory === "supabase-direct-db") {
    problems.push("direct db.* host is for DIRECT_DATABASE_URL / Drizzle Kit only");
  }
  if (target.databaseName === "(missing)") {
    problems.push("database name path is missing (use /postgres)");
  }
  if (problems.length === 0) {
    return target;
  }

  const message = `DATABASE_URL is not configured for the Supabase transaction pooler (${formatSafePostgresTarget(target)}). ${problems.join("; ")}.`;
  if (misconfigMode(env) === "throw") {
    throw new Error(message);
  }
  return { ...target, isTransactionPooler: false };
}

/**
 * Drizzle Kit must use the direct/session URI (port 5432), never the transaction pooler.
 */
export function assertMigrationDatabaseUrl(url: string): SafePostgresTarget {
  const target = describePostgresTarget(url, 1, "DIRECT_DATABASE_URL");
  if (target.port === TRANSACTION_POOLER_PORT || target.hostnameCategory === "supabase-pooler") {
    throw new Error(
      `DIRECT_DATABASE_URL must be the direct Postgres URI on port ${DIRECT_POSTGRES_PORT}, not the transaction pooler (${formatSafePostgresTarget(target)}).`,
    );
  }
  return target;
}

export function requireDirectDatabaseUrl(
  value: string | undefined,
): string {
  if (!value || value.trim().length === 0) {
    throw new Error(
      "DIRECT_DATABASE_URL is required for Drizzle Kit migrations. Use the direct Postgres URI (port 5432). Application runtime uses DATABASE_URL (transaction pooler, port 6543) and must not fall back to this value.",
    );
  }
  const normalized = requirePostgresConnectionString(value, "DIRECT_DATABASE_URL");
  assertMigrationDatabaseUrl(normalized);
  return normalized;
}

export function redactSecrets(text: string): string {
  return text
    .replace(/postgres(?:ql)?:\/\/[^@\s]+@/gi, "postgresql://[redacted]@")
    .replace(/sb_secret_[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/sb_publishable_[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[redacted-jwt]");
}
