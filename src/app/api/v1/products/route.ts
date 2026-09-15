import { handleApi } from "@/server/api";
import { jsonPage } from "@/server/http";
import { parsePublicProductQuery, searchParamsRecord } from "@/lib/validation/catalog";
import { listPublicProducts } from "@/server/services/catalog/product-service";

export async function GET(request: Request) {
  return handleApi(async () => {
    const query = parsePublicProductQuery(searchParamsRecord(new URL(request.url)));
    const result = await listPublicProducts(query);
    return jsonPage(result.data, result.pagination);
  });
}
