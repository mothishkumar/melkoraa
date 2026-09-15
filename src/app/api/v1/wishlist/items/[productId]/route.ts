import { requireApiAuth } from "@/lib/auth/api-guard";
import { handleApi } from "@/server/api";
import { jsonOk } from "@/server/http";
import { uuidSchema } from "@/lib/validation/wishlist";
import { removeWishlistItem } from "@/server/services/wishlist/wishlist-service";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const { productId } = await context.params;
    uuidSchema.parse(productId);
    const wishlist = await removeWishlistItem(auth.user.id, productId);
    return jsonOk(wishlist);
  });
}
