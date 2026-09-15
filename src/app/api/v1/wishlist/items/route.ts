import { requireApiAuth } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk } from "@/server/http";
import { addWishlistItemSchema } from "@/lib/validation/wishlist";
import { addWishlistItem } from "@/server/services/wishlist/wishlist-service";

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const body = addWishlistItemSchema.parse(await readJsonBody(request));
    const wishlist = await addWishlistItem(auth.user.id, body.productId);
    return jsonOk(wishlist);
  });
}
