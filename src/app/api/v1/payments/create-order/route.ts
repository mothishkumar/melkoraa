import { requireApiAuth } from "@/lib/auth/api-guard";
import { jsonError } from "@/server/http";

export async function POST() {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  return jsonError(
    "USE_CHECKOUT",
    "Razorpay orders are created by POST /api/v1/checkout. This endpoint is not used.",
    409,
  );
}
