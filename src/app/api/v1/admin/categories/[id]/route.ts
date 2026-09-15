import { requireApiAdmin, requireApiManager } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk } from "@/server/http";
import { updateCategorySchema, uuidSchema } from "@/lib/validation/catalog";
import { deleteCategory, updateCategory } from "@/server/services/catalog/category-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiManager();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const { id } = await context.params;
    uuidSchema.parse(id);
    const body = updateCategorySchema.parse(await readJsonBody(request));
    const category = await updateCategory(id, body, auth.user.id);
    return jsonOk(category);
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiAdmin();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const { id } = await context.params;
    uuidSchema.parse(id);
    await deleteCategory(id, auth.user.id);
    return new Response(null, { status: 204 });
  });
}
