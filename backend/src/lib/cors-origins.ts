function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/$/, "");
}

/**
 * Parse one or more comma-separated browser origins from env.
 * Empty segments are ignored; trailing slashes are stripped.
 */
export function parseCorsOrigins(
  value: string | undefined,
  fallback: string,
): string[] {
  const raw = value?.trim() ? value : fallback;
  const origins = raw
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
  return [...new Set(origins)];
}

/** Union of customer + admin configured origins for CORS and CSRF checks. */
export function allTrustedOrigins(): string[] {
  const customer = parseCorsOrigins(
    process.env.CORS_ORIGIN,
    "http://localhost:5173",
  );
  const admin = parseCorsOrigins(
    process.env.ADMIN_CORS_ORIGIN,
    "http://localhost:5174",
  );
  return [...new Set([...customer, ...admin])];
}
