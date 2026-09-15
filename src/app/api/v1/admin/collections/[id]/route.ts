import { requireApiManager } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk } from "@/server/http";
import { updateCollectionSchema, uuidSchema } from "@/lib/validation/catalog";
import {
  archiveCollection,
  updateCollection,
} from "@/server/services/catalog/collection-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiManager();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const { id } = await context.params;
    uuidSchema.parse(id);
    const body = updateCollectionSchema.parse(await readJsonBody(request));
    const collection = await updateCollection(id, body, auth.user.id);
    return jsonOk(collection);
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
    const collection = await archiveCollection(id, auth.user.id);
    return jsonOk(collection);
  });
}
