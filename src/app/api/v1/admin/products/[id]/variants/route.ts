import { requireApiManager } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk } from "@/server/http";
import { createVariantSchema, uuidSchema } from "@/lib/validation/catalog";
import { createVariant } from "@/server/services/catalog/product-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiManager();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const { id } = await context.params;
    uuidSchema.parse(id);
    const body = createVariantSchema.parse(await readJsonBody(request));
    const variant = await createVariant(id, body, auth.user.id);
    return jsonOk(variant, 201);
  });
}
