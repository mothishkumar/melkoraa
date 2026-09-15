import { requireApiStaff } from "@/lib/auth/api-guard";
import { handleApi } from "@/server/api";
import { jsonOk } from "@/server/http";
import { uuidSchema } from "@/lib/validation/checkout";
import { getAdminOrder } from "@/server/services/orders/order-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const { id } = await context.params;
    uuidSchema.parse(id);
    const order = await getAdminOrder(id);
    return jsonOk(order);
  });
}
