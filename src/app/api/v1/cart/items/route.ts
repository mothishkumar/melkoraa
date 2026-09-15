import { requireApiAuth } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk } from "@/server/http";
import { addCartItemSchema } from "@/lib/validation/cart";
import { addCartItem } from "@/server/services/cart/cart-service";

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const body = addCartItemSchema.parse(await readJsonBody(request));
    const cart = await addCartItem(auth.user.id, body.variantId, body.quantity);
    return jsonOk(cart);
  });
}
