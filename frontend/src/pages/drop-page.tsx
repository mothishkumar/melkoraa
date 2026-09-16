import { useEffect, useState } from "react";

import { StoreSurface } from "@/components/layout/store-surface";
import { ProductGrid } from "@/components/product/product-grid";
import { useAuth } from "@/contexts/auth-context";
import { brand } from "@/lib/brand";
import { fetchDrop, fetchProducts } from "@/lib/api/catalog";
import type { ProductListItem } from "@/types/catalog";

export function DropPage() {
  const { isAuthenticated } = useAuth();
  const [dropName, setDropName] = useState<string>(brand.drop.name);
  const [dropDescription, setDropDescription] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([
      fetchDrop("drop-001").then((drop) => {
        setDropName(drop.name);
        setDropDescription(drop.description ?? null);
      }),
      fetchProducts({ drop: "drop-001", pageSize: "20" }).then((result) => setProducts(result.data)),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="store-light min-h-[50vh] bg-[#f6f3ee]" />;
  }

  return (
    <StoreSurface>
      <div className="mx-auto max-w-[1600px] px-4 py-12 md:px-8 md:py-20">
        <p className="label-caps text-center">Limited release</p>
        <h1 className="editorial-display mt-4 text-center text-5xl md:text-7xl">{brand.drop.code}</h1>
        <p className="mt-3 text-center font-heading text-xl tracking-[0.28em] uppercase text-[#111]/75">{dropName}</p>
        <p className="mx-auto mt-6 max-w-xl text-center text-sm leading-7 text-[#6f6b66]">
          {dropDescription ?? "Four stories. One higher tomorrow."}
        </p>
        <div className="mt-16">
          <ProductGrid products={products} isAuthenticated={isAuthenticated} />
        </div>
      </div>
    </StoreSurface>
  );
}
