import Image from "next/image";
import Link from "next/link";

import { formatInr } from "@/lib/catalog/money";
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
  const category = product.categories[0]?.name;
  return (
    <article className="group">
      <div className="relative">
        <Link href={`/products/${product.slug}`} className="block">
          <div className="relative aspect-[4/5] overflow-hidden bg-[#ece8e1]">
            {product.primaryImage?.url ? (
              <Image
                src={product.primaryImage.url}
                alt={product.primaryImage.alt || product.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
              />
            ) : (
              <div className="flex h-full items-end px-4 py-5">
                <span className="editorial-display text-lg text-stone">{product.name}</span>
              </div>
            )}
            {product.isNew ? (
              <span className="absolute left-3 top-3 bg-black px-2 py-1 text-[0.55rem] tracking-[0.22em] text-off-white uppercase">
                New
              </span>
            ) : null}
          </div>
        </Link>
        {showWishlist ? (
          <div className="absolute right-3 top-3">
            <WishlistButton productId={product.id} initial={wishlisted} />
          </div>
        ) : null}
      </div>
      <div className="mt-4 text-center">
        <Link href={`/products/${product.slug}`} className="block">
          <h2 className="text-[0.8rem] tracking-[0.16em] uppercase">{product.name}</h2>
          {category ? <p className="mt-1 text-[0.65rem] tracking-[0.2em] uppercase text-stone">{category}</p> : null}
          <p className="mt-2 text-sm">{formatInr(product.basePrice)}</p>
        </Link>
        <Link
          href={`/products/${product.slug}`}
          className="mk-solid mt-4 w-full hover:opacity-85"
        >
          {product.available ? "Add to bag" : "Sold out"}
        </Link>
      </div>
    </article>
  );
}
