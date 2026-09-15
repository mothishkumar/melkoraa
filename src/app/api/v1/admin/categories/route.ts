import { requireApiManager, requireApiStaff } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk, jsonPage } from "@/server/http";
import {
  createCategorySchema,
  publicListQuerySchema,
  searchParamsRecord,
} from "@/lib/validation/catalog";
import {
  createCategory,
  listAdminCategories,
} from "@/server/services/catalog/category-service";

export async function GET(request: Request) {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const query = publicListQuerySchema.parse(searchParamsRecord(new URL(request.url)));
    const result = await listAdminCategories(query.page, query.pageSize);
    return jsonPage(result.data, result.pagination);
  });
}

export async function POST(request: Request) {
  const auth = await requireApiManager();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const body = createCategorySchema.parse(await readJsonBody(request));
    const category = await createCategory(body, auth.user.id);
    return jsonOk(category, 201);
  });
}
