import { requireApiStaff } from "@/lib/auth/api-guard";
import { handleApi } from "@/server/api";
import { jsonPage } from "@/server/http";
import { searchParamsRecord } from "@/lib/validation/catalog";
import { orderListQuerySchema } from "@/lib/validation/checkout";
import { listAdminOrders } from "@/server/services/orders/order-service";

export async function GET(request: Request) {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const query = orderListQuerySchema.parse(searchParamsRecord(new URL(request.url)));
    const result = await listAdminOrders(query.page, query.pageSize, {
      status: query.status,
      paymentStatus: query.paymentStatus,
      search: query.search,
    });
    return jsonPage(result.data, result.pagination);
  });
}
