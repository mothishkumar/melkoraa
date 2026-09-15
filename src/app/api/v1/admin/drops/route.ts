import { requireApiManager, requireApiStaff } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk, jsonPage } from "@/server/http";
import {
  createDropSchema,
  publicListQuerySchema,
  searchParamsRecord,
} from "@/lib/validation/catalog";
import { createDrop, listAdminDrops } from "@/server/services/catalog/drop-service";

export async function GET(request: Request) {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const query = publicListQuerySchema.parse(searchParamsRecord(new URL(request.url)));
    const result = await listAdminDrops(query.page, query.pageSize);
    return jsonPage(result.data, result.pagination);
  });
}

export async function POST(request: Request) {
  const auth = await requireApiManager();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const body = createDropSchema.parse(await readJsonBody(request));
    const drop = await createDrop(body, auth.user.id);
    return jsonOk(drop, 201);
  });
}
