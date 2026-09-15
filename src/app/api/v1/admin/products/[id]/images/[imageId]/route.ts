import { requireApiManager } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk } from "@/server/http";
import { updateImageSchema, uuidSchema } from "@/lib/validation/catalog";
import {
  deleteProductImage,
  updateProductImage,
} from "@/server/services/catalog/product-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; imageId: string }> },
) {
  const auth = await requireApiManager();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const { id, imageId } = await context.params;
    uuidSchema.parse(id);
    uuidSchema.parse(imageId);
    const body = updateImageSchema.parse(await readJsonBody(request));
    const image = await updateProductImage(id, imageId, body, auth.user.id);
    return jsonOk(image);
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; imageId: string }> },
) {
  const auth = await requireApiManager();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const { id, imageId } = await context.params;
    uuidSchema.parse(id);
    uuidSchema.parse(imageId);
    await deleteProductImage(id, imageId, auth.user.id);
    return new Response(null, { status: 204 });
  });
}
