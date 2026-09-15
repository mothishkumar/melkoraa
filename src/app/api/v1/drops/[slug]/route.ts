import { handleApi } from "@/server/api";
import { jsonOk } from "@/server/http";
import { getPublicDropBySlug } from "@/server/services/catalog/drop-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  return handleApi(async () => {
    const { slug } = await context.params;
    const drop = await getPublicDropBySlug(slug);
    return jsonOk(drop);
  });
}
