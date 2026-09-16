import { requireApiManager } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk } from "@/server/http";
import { mutationRateLimitResponse } from "@/server/rate-limit-guard";
import { adjustInventorySchema, uuidSchema } from "@/lib/validation/inventory";
import { adjustInventory } from "@/server/services/inventory/inventory-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ variantId: string }> },
) {
  const auth = await requireApiManager();
  if (!auth.ok) return auth.response;
  const limited = mutationRateLimitResponse(request, "admin.inventory.adjust", auth.user.id, 30);
  if (limited) return limited;

  return handleApi(async () => {
    const { variantId } = await context.params;
    uuidSchema.parse(variantId);
    const body = adjustInventorySchema.parse(await readJsonBody(request));
    const inventory = await adjustInventory(variantId, body.delta, {
      actorId: auth.user.id,
      notes: body.notes,
      referenceType: body.referenceType,
      referenceId: body.referenceId,
    });
    return jsonOk(inventory);
  });
}
