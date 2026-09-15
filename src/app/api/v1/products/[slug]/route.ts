import { handleApi } from "@/server/api";
import { jsonOk } from "@/server/http";
import { getPublicProductBySlug } from "@/server/services/catalog/product-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  return handleApi(async () => {
    const { slug } = await context.params;
    const product = await getPublicProductBySlug(slug);
    return jsonOk(product);
  });
}
