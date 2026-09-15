import { requireApiManager, requireApiStaff } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk, jsonPage } from "@/server/http";
import {
  createCollectionSchema,
  publicListQuerySchema,
  searchParamsRecord,
} from "@/lib/validation/catalog";
import {
  createCollection,
  listAdminCollections,
} from "@/server/services/catalog/collection-service";

export async function GET(request: Request) {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const query = publicListQuerySchema.parse(searchParamsRecord(new URL(request.url)));
    const result = await listAdminCollections(query.page, query.pageSize);
    return jsonPage(result.data, result.pagination);
  });
}

export async function POST(request: Request) {
  const auth = await requireApiManager();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const body = createCollectionSchema.parse(await readJsonBody(request));
    const collection = await createCollection(body, auth.user.id);
    return jsonOk(collection, 201);
  });
}
