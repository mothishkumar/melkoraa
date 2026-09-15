import { requireApiManager } from "@/lib/auth/api-guard";
import { handleApi } from "@/server/api";
import { jsonPage } from "@/server/http";
import { searchParamsRecord } from "@/lib/validation/catalog";
import { adminAuditQuerySchema } from "@/lib/validation/admin";
import { listAdminAuditLogs } from "@/server/services/admin/audit-service";

export async function GET(request: Request) {
  const auth = await requireApiManager();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const query = adminAuditQuerySchema.parse(searchParamsRecord(new URL(request.url)));
    const result = await listAdminAuditLogs(query);
    return jsonPage(result.data, result.pagination);
  });
}
