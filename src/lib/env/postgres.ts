export const runtimePostgresOptions = {
  prepare: false,
  ssl: "require" as const,
  max: 1,
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

export function redactSecrets(text: string): string {
  return text
    .replace(/postgres(?:ql)?:\/\/[^@\s]+@/gi, "postgresql://[redacted]@")
    .replace(/sb_secret_[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/sb_publishable_[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[redacted-jwt]");
}
