import { requireApiAuth } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk } from "@/server/http";
import { verifyPaymentBodySchema } from "@/lib/validation/payments";
import { verifyCustomerCheckoutPayment } from "@/server/services/payments/payment-service";

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

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
