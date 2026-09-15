import { jsonError } from "@/server/http";

export async function POST() {
  return jsonError(
    "WEBHOOK_MOVED",
    "Use POST /api/v1/webhooks/razorpay.",
    404,
  );
}
