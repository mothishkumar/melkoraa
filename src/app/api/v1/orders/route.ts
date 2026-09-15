import { requireApiAuth } from "@/lib/auth/api-guard";
import { handleApi } from "@/server/api";
import { jsonPage } from "@/server/http";
import { searchParamsRecord } from "@/lib/validation/catalog";
import { orderListQuerySchema } from "@/lib/validation/checkout";
import { listCustomerOrders } from "@/server/services/orders/order-service";

export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const query = orderListQuerySchema.parse(searchParamsRecord(new URL(request.url)));
    const result = await listCustomerOrders(auth.user.id, query.page, query.pageSize);
    return jsonPage(result.data, result.pagination);
  });
}
