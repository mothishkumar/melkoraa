import Image from "next/image";
import Link from "next/link";

import { formatInr } from "@/lib/catalog/money";
import { brand } from "@/lib/brand";
import type { ProductListItem } from "@/types/catalog";
import { WishlistButton } from "@/components/product/wishlist-button";

export function ProductCard({
  product,
  wishlisted = false,
  showWishlist = false,
}: {
  product: ProductListItem;
  wishlisted?: boolean;
  showWishlist?: boolean;
}) {
  return (
    <article className="group">
      <div className="relative">
        <Link href={`/products/${product.slug}`} className="block">
          <div className="relative aspect-[3/4] overflow-hidden bg-charcoal">
            {product.primaryImage?.url ? (
              <Image
                src={product.primaryImage.url}
                alt={product.primaryImage.alt || product.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex h-full items-end px-4 py-5">
                <span className="editorial-display text-lg text-stone">{product.name}</span>
              </div>
            )}
            <div className="absolute left-3 top-3 flex flex-col gap-1">
              {product.isNew ? (
                <span className="label-caps bg-black/80 px-2 py-1 text-[0.55rem] text-off-white">New</span>
              ) : null}
              <span className="label-caps bg-black/80 px-2 py-1 text-[0.55rem] text-off-white">
                {brand.drop.code}
              </span>
            </div>
          </div>
        </Link>
        {showWishlist ? (
          <div className="absolute right-3 top-3">
            <WishlistButton productId={product.id} initial={wishlisted} />
          </div>
        ) : null}
      </div>
      <Link href={`/products/${product.slug}`} className="mt-4 block">
        <h2 className="text-sm tracking-[0.08em] uppercase">{product.name}</h2>
        <p className="mt-2 text-sm text-stone">{formatInr(product.basePrice)}</p>
        <p className="mt-1 label-caps text-[0.6rem]">
          {product.available ? "Available" : "Sold out"}
        </p>
      </Link>
    </article>
  );
}
