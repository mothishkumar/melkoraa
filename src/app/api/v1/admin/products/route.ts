import { requireApiManager, requireApiStaff } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk, jsonPage } from "@/server/http";
import {
  adminProductQuerySchema,
  createProductSchema,
  searchParamsRecord,
} from "@/lib/validation/catalog";
import {
  createProduct,
  listAdminProducts,
} from "@/server/services/catalog/product-service";

export async function GET(request: Request) {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const query = adminProductQuerySchema.parse(searchParamsRecord(new URL(request.url)));
    const result = await listAdminProducts(query);
    return jsonPage(result.data, result.pagination);
  });
}

export async function POST(request: Request) {
  const auth = await requireApiManager();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const body = createProductSchema.parse(await readJsonBody(request));
    const product = await createProduct(body, auth.user.id);
    return jsonOk(product, 201);
  });
}
