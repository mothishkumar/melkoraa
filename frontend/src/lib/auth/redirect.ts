const FALLBACK = "/account";

function isSafeRelativePath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.startsWith("/\\")) return false;
  if (path.includes("://")) return false;
  if (path.includes("\\")) return false;
  // eslint-disable-next-line no-control-regex -- block control chars in redirect paths
  if (/[\u0000-\u001f\u007f]/.test(path)) return false;
  if (path.includes("\\u0000")) return false;
  return true;
}

/**
 * Only internal relative paths are allowed. Rejects protocol-relative URLs,
 * absolute URLs, and other open-redirect patterns.
 */
export function getSafeRedirectPath(
  raw: string | null | undefined,
  fallback: string = FALLBACK,
): string {
  if (!raw) return fallback;

  const candidate = raw.trim();

  if (/^https?:\/\//i.test(candidate) || /^\/\//.test(candidate)) {
    return fallback;
  }

  const [pathOnly] = candidate.split("?");
  if (!pathOnly || !isSafeRelativePath(pathOnly)) {
    return fallback;
  }

  if (!isSafeRelativePath(candidate.split("#")[0] ?? candidate)) {
    return fallback;
  }

  return candidate;
}

export function withSafeNextParam(pathname: string, next: string): string {
  const safe = getSafeRedirectPath(next, pathname);
  const url = new URL(pathname, "http://melkoraa.local");
  url.searchParams.set("next", safe);
  return `${url.pathname}?${url.searchParams.toString()}`;
}
