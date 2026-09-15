import { requireApiAuth } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk } from "@/server/http";
import { checkoutBodySchema } from "@/lib/validation/checkout";
import { checkout } from "@/server/services/checkout/checkout-service";

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const body = checkoutBodySchema.parse(await readJsonBody(request));
    const order = await checkout(auth.user.id, body);
    return jsonOk(order, 201);
  });
}
