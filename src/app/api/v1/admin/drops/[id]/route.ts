import { requireApiManager, requireApiStaff } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk } from "@/server/http";
import { updateDropSchema, uuidSchema } from "@/lib/validation/catalog";
import { archiveDrop, getAdminDrop, updateDrop } from "@/server/services/catalog/drop-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const { id } = await context.params;
    uuidSchema.parse(id);
    const drop = await getAdminDrop(id);
    return jsonOk(drop);
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
    const body = updateDropSchema.parse(await readJsonBody(request));
    const drop = await updateDrop(id, body, auth.user.id);
    return jsonOk(drop);
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
    const drop = await archiveDrop(id, auth.user.id);
    return jsonOk(drop);
  });
}
