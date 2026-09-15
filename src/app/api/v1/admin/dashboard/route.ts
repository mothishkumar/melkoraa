import { requireApiStaff } from "@/lib/auth/api-guard";
import { handleApi } from "@/server/api";
import { jsonOk } from "@/server/http";
import { getAdminDashboard } from "@/server/services/admin/dashboard-service";

export async function GET() {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const snapshot = await getAdminDashboard();
    return jsonOk(snapshot);
  });
}
