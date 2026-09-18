import { Image } from "@/components/ui/image";
import { Link } from "react-router-dom";

import { AddToBagButton } from "@/components/product/add-to-bag-button";
import { WishlistButton } from "@/components/product/wishlist-button";
import { withDrop001ListMedia } from "@/lib/catalog/drop-001";
import { formatInr } from "@/lib/catalog/money";
import type { ProductListItem } from "@/types/catalog";

export function ProductCard({
  product,
  wishlisted = false,
  showWishlist = false,
  isAuthenticated = false,
}: {
  product: ProductListItem;
  wishlisted?: boolean;
  showWishlist?: boolean;
  isAuthenticated?: boolean;
}) {
  const item = withDrop001ListMedia(product);
  const category = item.categories[0]?.name;
  return (
    <article className="group min-w-0">
      <div className="relative">
        <Link to={`/products/${item.slug}`} className="block">
          <div className="relative aspect-[4/5] overflow-hidden bg-[#ece8e1]">
            {item.primaryImage?.url ? (
              <Image
                src={item.primaryImage.url}
                alt={item.primaryImage.alt || item.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
              />
            ) : (
              <div className="flex h-full items-end px-4 py-5">
                <span className="editorial-display text-lg text-stone">{item.name}</span>
              </div>
            )}
            {item.isNew ? (
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
        <Link to={`/products/${item.slug}`} className="block">
          <h2 className="text-[0.8rem] tracking-[0.16em] break-words uppercase">{item.name}</h2>
          {category ? <p className="mt-1 text-[0.65rem] tracking-[0.2em] uppercase text-stone">{category}</p> : null}
          <p className="mt-2 text-sm">{formatInr(item.basePrice)}</p>
        </Link>
        <AddToBagButton
          productName={item.name}
          productSlug={item.slug}
          variants={item.variants}
          available={item.available}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </article>
  );
}
