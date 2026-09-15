import { requireApiManager, requireApiStaff } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk } from "@/server/http";
import { updateProductSchema, uuidSchema } from "@/lib/validation/catalog";
import {
  archiveProduct,
  getAdminProduct,
  updateProduct,
} from "@/server/services/catalog/product-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const { id } = await context.params;
    uuidSchema.parse(id);
    const product = await getAdminProduct(id);
    return jsonOk(product);
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiManager();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const { id } = await context.params;
    uuidSchema.parse(id);
    const body = updateProductSchema.parse(await readJsonBody(request));
    const product = await updateProduct(id, body, auth.user.id);
    return jsonOk(product);
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiManager();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const { id } = await context.params;
    uuidSchema.parse(id);
    const product = await archiveProduct(id, auth.user.id);
    return jsonOk(product);
  });
}
