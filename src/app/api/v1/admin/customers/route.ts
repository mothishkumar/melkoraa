import { requireApiStaff } from "@/lib/auth/api-guard";
import { handleApi } from "@/server/api";
import { jsonPage } from "@/server/http";
import { searchParamsRecord } from "@/lib/validation/catalog";
import { adminCustomerQuerySchema } from "@/lib/validation/admin";
import { listAdminCustomers } from "@/server/services/customers/customer-service";

export async function GET(request: Request) {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const query = adminCustomerQuerySchema.parse(searchParamsRecord(new URL(request.url)));
    const result = await listAdminCustomers(query);
    return jsonPage(result.data, result.pagination);
  });
}
