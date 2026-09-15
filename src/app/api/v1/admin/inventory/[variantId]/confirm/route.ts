import { requireApiManager } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk } from "@/server/http";
import { stockMutationSchema, uuidSchema } from "@/lib/validation/inventory";
import { confirmInventorySale } from "@/server/services/inventory/inventory-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ variantId: string }> },
) {
  const auth = await requireApiManager();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const { variantId } = await context.params;
    uuidSchema.parse(variantId);
    const body = stockMutationSchema.parse(await readJsonBody(request));
    const inventory = await confirmInventorySale(variantId, body.quantity, {
      actorId: auth.user.id,
      notes: body.notes,
      referenceType: body.referenceType,
      referenceId: body.referenceId,
    });
    return jsonOk(inventory);
  });
}
