import { requireApiAuth } from "@/lib/auth/api-guard";
import { handleApi } from "@/server/api";
import { jsonOk } from "@/server/http";
import { uuidSchema } from "@/lib/validation/checkout";
import { cancelCustomerOrder } from "@/server/services/orders/order-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const { orderId } = await context.params;
    uuidSchema.parse(orderId);
    const order = await cancelCustomerOrder(auth.user.id, orderId);
    return jsonOk(order);
  });
}
