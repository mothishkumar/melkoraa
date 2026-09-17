export function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_URL ?? "";
  if (!base) return path;
  if (path.startsWith("http")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/$/, "")}${normalized}`;
}
