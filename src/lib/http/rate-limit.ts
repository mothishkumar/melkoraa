type RateLimitResult = { ok: true } | { ok: false; retryAfterMs: number };

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

export function resetRateLimitStore() {
  buckets.clear();
}

export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): RateLimitResult {
  const existing = buckets.get(key) ?? { timestamps: [] };
  const windowStart = now - windowMs;
  const timestamps = existing.timestamps.filter((stamp) => stamp > windowStart);
  if (timestamps.length >= limit) {
    buckets.set(key, { timestamps });
    const oldest = timestamps[0] ?? now;
    return { ok: false, retryAfterMs: Math.max(0, oldest + windowMs - now) };
  }
  timestamps.push(now);
  buckets.set(key, { timestamps });
  if (buckets.size > 10_000) {
    for (const [entryKey, entry] of buckets) {
      if (entry.timestamps.every((stamp) => stamp <= windowStart)) {
        buckets.delete(entryKey);
      }
    }
  }
  return { ok: true };
}

export function clientRateLimitKey(request: Request, userId?: string | null): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const ip = forwarded || realIp || "local";
  return userId ? `${ip}:${userId}` : ip;
}
