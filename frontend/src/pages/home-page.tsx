import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { HomeHero } from "@/components/layout/home-hero";
import { StoreSurface } from "@/components/layout/store-surface";
import { ProductGrid } from "@/components/product/product-grid";
import { useAuth } from "@/contexts/auth-context";
import { brand } from "@/lib/brand";
import { fetchProducts } from "@/lib/api/catalog";
import type { ProductListItem } from "@/types/catalog";

export function HomePage() {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchProducts({ drop: "drop-001", pageSize: "6" })
      .then((result) => setProducts(result.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="min-h-[70vh] bg-black" />;
  }

  return (
    <>
      <HomeHero products={products} />
      <StoreSurface>
        <section className="mx-auto max-w-[1600px] px-4 py-20 md:px-8 md:py-28">
          <p className="label-caps text-center">Limited release</p>
          <h2 className="editorial-display mt-4 text-center text-4xl md:text-6xl">{brand.drop.code}</h2>
          <p className="mt-3 text-center font-heading text-xl tracking-[0.2em] uppercase text-[#111]/70">{brand.drop.name}</p>
          <p className="mx-auto mt-4 max-w-md text-center text-sm text-[#6f6b66]">{brand.drop.message}</p>
          <figure className="mt-14 overflow-hidden border border-black/10">
            <img
              src="/lookbook/identity-line.png"
              alt="DROP 001 identity line: Essential, Signature, and Statement oversized tees"
              className="h-auto w-full"
            />
            <figcaption className="px-4 py-3 text-center text-[0.62rem] tracking-[0.22em] uppercase text-[#6f6b66]">
              01 Essential · 02 Signature · 03 Statement
            </figcaption>
          </figure>
          <div className="mt-14">
            <ProductGrid products={products} isAuthenticated={isAuthenticated} emptyLabel="THE DROP IS BEING SET." />
          </div>
          <div className="mt-14 flex justify-center">
            <Link to="/drop-001" className="mk-outline border-black text-[#111] hover:bg-black hover:text-[#f6f3ee]">View the drop</Link>
          </div>
        </section>
      </StoreSurface>
    </>
  );
}
