import { requireApiAuth } from "@/lib/auth/api-guard";
import { handleApi } from "@/server/api";
import { jsonOk } from "@/server/http";
import { clearCart, getCart } from "@/server/services/cart/cart-service";

export async function GET() {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  return handleApi(async () => jsonOk(await getCart(auth.user.id)));
}

export async function DELETE() {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  return handleApi(async () => jsonOk(await clearCart(auth.user.id)));
}
