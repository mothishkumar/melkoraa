import { requireApiAuth } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk } from "@/server/http";
import { updateCartItemSchema, uuidSchema } from "@/lib/validation/cart";
import { removeCartItem, updateCartItem } from "@/server/services/cart/cart-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ variantId: string }> },
) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const { variantId } = await context.params;
    uuidSchema.parse(variantId);
    const body = updateCartItemSchema.parse(await readJsonBody(request));
    const cart = await updateCartItem(auth.user.id, variantId, body.quantity);
    return jsonOk(cart);
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ variantId: string }> },
) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const { variantId } = await context.params;
    uuidSchema.parse(variantId);
    const cart = await removeCartItem(auth.user.id, variantId);
    return jsonOk(cart);
  });
}
