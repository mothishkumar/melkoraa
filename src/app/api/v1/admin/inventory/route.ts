import { requireApiManager, requireApiStaff } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk, jsonPage } from "@/server/http";
import { searchParamsRecord } from "@/lib/validation/catalog";
import {
  initializeInventorySchema,
  inventoryListQuerySchema,
} from "@/lib/validation/inventory";
import {
  initializeInventory,
  listAdminInventory,
} from "@/server/services/inventory/inventory-service";

export async function GET(request: Request) {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const query = inventoryListQuerySchema.parse(searchParamsRecord(new URL(request.url)));
    const result = await listAdminInventory(query);
    return jsonPage(result.data, result.pagination);
  });
}

export async function POST(request: Request) {
  const auth = await requireApiManager();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const body = initializeInventorySchema.parse(await readJsonBody(request));
    const inventory = await initializeInventory(body, auth.user.id);
    return jsonOk(inventory, 201);
  });
}
