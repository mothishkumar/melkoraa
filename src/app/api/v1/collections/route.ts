import { handleApi } from "@/server/api";
import { jsonPage } from "@/server/http";
import { publicListQuerySchema, searchParamsRecord } from "@/lib/validation/catalog";
import { listPublicCollections } from "@/server/services/catalog/collection-service";

export async function GET(request: Request) {
  return handleApi(async () => {
    const query = publicListQuerySchema.parse(searchParamsRecord(new URL(request.url)));
    const result = await listPublicCollections(query.page, query.pageSize);
    return jsonPage(result.data, result.pagination);
  });
}
