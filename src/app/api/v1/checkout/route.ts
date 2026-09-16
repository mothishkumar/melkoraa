import { requireApiAuth } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk } from "@/server/http";
import { mutationRateLimitResponse } from "@/server/rate-limit-guard";
import { checkoutBodySchema } from "@/lib/validation/checkout";
import { checkout } from "@/server/services/checkout/checkout-service";

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  const limited = mutationRateLimitResponse(request, "checkout", auth.user.id, 8);
  if (limited) return limited;

  return handleApi(async () => {
    const body = checkoutBodySchema.parse(await readJsonBody(request));
    const session = await checkout(auth.user.id, body);
    return jsonOk(session, 201);
  });
}
