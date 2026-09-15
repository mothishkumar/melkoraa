const SENSITIVE_KEY =
  /secret|password|passwd|token|key|credential|authorization|cookie|database|webhook|private|service.?role/i;

export function sanitizeAuditMetadata(metadata: unknown): Record<string, unknown> {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata as Record<string, unknown>)) {
    if (SENSITIVE_KEY.test(key)) continue;
    if (value === null || typeof value === "number" || typeof value === "boolean") {
      result[key] = value;
      continue;
    }
    if (typeof value === "string") {
      result[key] = value.length > 240 ? `${value.slice(0, 240)}…` : value;
      continue;
    }
    result[key] = "[omitted]";
  }
  return result;
}
