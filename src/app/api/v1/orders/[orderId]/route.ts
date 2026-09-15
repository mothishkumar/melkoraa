import { requireApiAuth } from "@/lib/auth/api-guard";
import { handleApi } from "@/server/api";
import { jsonOk } from "@/server/http";
import { uuidSchema } from "@/lib/validation/checkout";
import { getCustomerOrder } from "@/server/services/orders/order-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const { orderId } = await context.params;
    uuidSchema.parse(orderId);
    const order = await getCustomerOrder(auth.user.id, orderId);
    return jsonOk(order);
  });
}
