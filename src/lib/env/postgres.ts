export const runtimePostgresOptions = {
  prepare: false,
  ssl: "require" as const,
  max: 1,
};

export function isPostgresConnectionString(value: string): boolean {
  return value.startsWith("postgres://") || value.startsWith("postgresql://");
}

/**
 * Supabase URI copies sometimes wrap the hostname in IPv6 brackets.
 * Brackets are only valid for IPv6 addresses, so strip them for hostnames.
 */
export function normalizePostgresConnectionString(value: string): string {
  return value.trim().replace(/@\[([^\]:]+)\]:/g, "@$1:");
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

export function redactSecrets(text: string): string {
  return text
    .replace(/postgres(?:ql)?:\/\/[^@\s]+@/gi, "postgresql://[redacted]@")
    .replace(/sb_secret_[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/sb_publishable_[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[redacted-jwt]");
}
