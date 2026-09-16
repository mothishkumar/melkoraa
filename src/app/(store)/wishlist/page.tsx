import Link from "next/link";

import { StoreSurface } from "@/components/layout/store-surface";
import { requireAuth } from "@/lib/auth/require-auth";
import { formatInr } from "@/lib/catalog/money";
import { getWishlist } from "@/server/services/wishlist/wishlist-service";
import { WishlistRemove } from "@/components/product/wishlist-remove";

export const metadata = {
  title: "Wishlist",
};

export default async function WishlistPage() {
  const { user } = await requireAuth("/wishlist");
  const wishlist = await getWishlist(user.id);

  if (wishlist.items.length === 0) {
    return (
      <StoreSurface>
        <div className="mx-auto max-w-[900px] px-4 py-24 text-center md:px-8">
          <p className="editorial-display text-4xl">NOTHING SAVED YET.</p>
          <Link href="/products" className="mk-outline mt-8 border-black">
            Continue shopping
          </Link>
        </div>
      </StoreSurface>
    );
  }

  return (
    <StoreSurface>
      <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
        <p className="label-caps">Wishlist</p>
        <h1 className="editorial-display mt-4 text-4xl">Saved</h1>
        <ul className="mt-12 divide-y divide-black/10 border-y border-black/10">
          {wishlist.items.map((item) => (
            <li key={item.productId} className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link href={`/products/${item.slug}`} className="text-sm uppercase tracking-[0.08em]">
                  {item.name}
                </Link>
                <p className="mt-2 text-sm text-[#6f6b66]">{formatInr(item.price)}</p>
                <p className="mt-1 label-caps text-[0.6rem]">
                  {item.available ? "Available" : "Unavailable"}
                </p>
              </div>
              <WishlistRemove productId={item.productId} />
            </li>
          ))}
        </ul>
      </div>
    </StoreSurface>
  );
}
