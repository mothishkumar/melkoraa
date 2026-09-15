import { requireApiManager } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk } from "@/server/http";
import { dropProductSchema, uuidSchema } from "@/lib/validation/catalog";
import { associateDropProduct } from "@/server/services/catalog/drop-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiManager();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const { id } = await context.params;
    uuidSchema.parse(id);
    const body = dropProductSchema.parse(await readJsonBody(request));
    const drop = await associateDropProduct(id, body.productId, body.displayOrder, auth.user.id);
    return jsonOk(drop, 201);
  });
}
