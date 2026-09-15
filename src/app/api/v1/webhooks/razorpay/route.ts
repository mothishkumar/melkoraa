import { handleApi } from "@/server/api";
import { jsonOk } from "@/server/http";
import { processRazorpayWebhook } from "@/server/services/payments/payment-service";

export async function POST(request: Request) {
  return handleApi(async () => {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";
    const result = await processRazorpayWebhook({ rawBody, signature });
    return jsonOk(result);
  });
}
