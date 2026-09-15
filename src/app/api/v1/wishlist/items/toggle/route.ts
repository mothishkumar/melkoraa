import { requireApiAuth } from "@/lib/auth/api-guard";
import { handleApi, readJsonBody } from "@/server/api";
import { jsonOk } from "@/server/http";
import { toggleWishlistItemSchema } from "@/lib/validation/wishlist";
import { toggleWishlistItem } from "@/server/services/wishlist/wishlist-service";

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const body = toggleWishlistItemSchema.parse(await readJsonBody(request));
    const wishlist = await toggleWishlistItem(auth.user.id, body.productId);
    return jsonOk(wishlist);
  });
}
