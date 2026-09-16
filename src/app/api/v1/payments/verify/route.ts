import { requireApiAuth } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk } from "@/server/http";
import { mutationRateLimitResponse } from "@/server/rate-limit-guard";
import { verifyPaymentBodySchema } from "@/lib/validation/payments";
import { verifyCustomerCheckoutPayment } from "@/server/services/payments/payment-service";

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  const limited = mutationRateLimitResponse(request, "payments.verify", auth.user.id, 20);
  if (limited) return limited;

  return handleApi(async () => {
    const body = verifyPaymentBodySchema.parse(await readJsonBody(request));
    const result = await verifyCustomerCheckoutPayment(auth.user.id, body);
    return jsonOk({
      order: result.order,
      payment: result.payment,
      alreadyFinalized: result.alreadyFinalized,
    });
  });
}
