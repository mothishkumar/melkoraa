import { requireApiAuth } from "@/lib/auth/api-guard";
import { handleApi } from "@/server/api";
import { jsonOk } from "@/server/http";
import { getWishlist } from "@/server/services/wishlist/wishlist-service";

export async function GET() {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  return handleApi(async () => jsonOk(await getWishlist(auth.user.id)));
}
