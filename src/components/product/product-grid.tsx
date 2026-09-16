import Link from "next/link";

import { ProductCard } from "@/components/product/product-card";
import type { ProductListItem } from "@/types/catalog";
import type { PaginationMeta } from "@/server/http";

export function ProductGrid({
  products,
  wishlistedIds,
  showWishlist,
  emptyLabel = "NO PIECES FOUND.",
}: {
  products: ProductListItem[];
  wishlistedIds?: Set<string>;
  showWishlist?: boolean;
  emptyLabel?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="border-t border-current/15 py-24 text-center">
        <p className="editorial-display text-3xl">{emptyLabel}</p>
        <Link href="/products" className="mt-8 inline-block label-caps">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-14 md:grid-cols-3 lg:grid-cols-4 md:gap-x-8">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          showWishlist={showWishlist}
          wishlisted={wishlistedIds?.has(product.id)}
        />
      ))}
    </div>
  );
}

export function Pagination({
  pagination,
  basePath,
  searchParams,
}: {
  pagination: PaginationMeta;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  if (pagination.totalPages <= 1) return null;
  const makeHref = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") params.set(key, value);
    }
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };
  return (
    <nav className="mt-16 flex items-center justify-between border-t border-current/15 pt-8" aria-label="Pagination">
      {pagination.page > 1 ? (
        <Link href={makeHref(pagination.page - 1)} className="label-caps">
          Previous
        </Link>
      ) : (
        <span />
      )}
      <p className="text-xs tracking-[0.2em] uppercase text-[#6f6b66]">
        {pagination.page} / {pagination.totalPages}
      </p>
      {pagination.page < pagination.totalPages ? (
        <Link href={makeHref(pagination.page + 1)} className="label-caps">
          Next
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
