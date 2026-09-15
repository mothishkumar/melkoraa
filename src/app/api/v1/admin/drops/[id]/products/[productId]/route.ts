import { requireApiManager } from "@/lib/auth/api-guard";
import { handleApi } from "@/server/api";
import { uuidSchema } from "@/lib/validation/catalog";
import { dissociateDropProduct } from "@/server/services/catalog/drop-service";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; productId: string }> },
) {
  const auth = await requireApiManager();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const { id, productId } = await context.params;
    uuidSchema.parse(id);
    uuidSchema.parse(productId);
    await dissociateDropProduct(id, productId, auth.user.id);
    return new Response(null, { status: 204 });
  });
}
