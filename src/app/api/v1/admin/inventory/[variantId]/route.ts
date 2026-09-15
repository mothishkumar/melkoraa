import { requireApiStaff } from "@/lib/auth/api-guard";
import { handleApi } from "@/server/api";
import { jsonOk } from "@/server/http";
import { uuidSchema } from "@/lib/validation/inventory";
import { getAdminInventory } from "@/server/services/inventory/inventory-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ variantId: string }> },
) {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const { variantId } = await context.params;
    uuidSchema.parse(variantId);
    const inventory = await getAdminInventory(variantId);
    return jsonOk(inventory);
  });
}
