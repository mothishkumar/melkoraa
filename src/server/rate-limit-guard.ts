import { consumeRateLimit, clientRateLimitKey } from "@/lib/http/rate-limit";
import { jsonError } from "@/server/http";

export function mutationRateLimitResponse(
  request: Request,
  scope: string,
  userId: string | null | undefined,
  limit: number,
  windowMs = 60_000,
): Response | null {
  const result = consumeRateLimit(`${scope}:${clientRateLimitKey(request, userId)}`, limit, windowMs);
  if (result.ok) return null;
  return jsonError("RATE_LIMITED", "Too many requests. Try again shortly.", 429);
}
