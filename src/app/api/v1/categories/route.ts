import { handleApi } from "@/server/api";
import { jsonPage } from "@/server/http";
import { publicListQuerySchema, searchParamsRecord } from "@/lib/validation/catalog";
import { listPublicCategories } from "@/server/services/catalog/category-service";

export async function GET(request: Request) {
  return handleApi(async () => {
    const query = publicListQuerySchema.parse(searchParamsRecord(new URL(request.url)));
    const result = await listPublicCategories(query.page, query.pageSize);
    return jsonPage(result.data, result.pagination);
  });
}
