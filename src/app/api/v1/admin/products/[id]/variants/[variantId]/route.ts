import { requireApiManager } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk } from "@/server/http";
import { updateVariantSchema, uuidSchema } from "@/lib/validation/catalog";
import {
  deactivateVariant,
  updateVariant,
} from "@/server/services/catalog/product-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; variantId: string }> },
) {
  const auth = await requireApiManager();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const { id, variantId } = await context.params;
    uuidSchema.parse(id);
    uuidSchema.parse(variantId);
    const body = updateVariantSchema.parse(await readJsonBody(request));
    const variant = await updateVariant(id, variantId, body, auth.user.id);
    return jsonOk(variant);
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; variantId: string }> },
) {
  const auth = await requireApiManager();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const { id, variantId } = await context.params;
    uuidSchema.parse(id);
    uuidSchema.parse(variantId);
    const variant = await deactivateVariant(id, variantId, auth.user.id);
    return jsonOk(variant);
  });
}
