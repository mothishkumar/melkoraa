import "server-only";

const BEARER_PREFIX = /^Bearer\s+/i;

export function extractBearerToken(
  headerValue: string | null | undefined,
): string | null {
  if (!headerValue) {
    return null;
  }

  const trimmed = headerValue.trim();
  if (!trimmed || !BEARER_PREFIX.test(trimmed)) {
    return null;
  }

  const token = trimmed.replace(BEARER_PREFIX, "").trim();
  return token.length > 0 ? token : null;
}

export function readBearerTokenFromHeaders(
  headers: Headers | { get(name: string): string | null },
): string | null {
  return extractBearerToken(headers.get("authorization"));
}
