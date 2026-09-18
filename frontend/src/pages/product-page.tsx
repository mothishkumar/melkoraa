import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { StoreSurface } from "@/components/layout/store-surface";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product/product-purchase";
import { useAuth } from "@/contexts/auth-context";
import { fetchProduct } from "@/lib/api/catalog";
import { DROP_001_BY_SLUG, withDrop001DetailMedia } from "@/lib/catalog/drop-001";
import type { ProductDetail } from "@/types/catalog";

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    void fetchProduct(slug)
      .then((detail) => setProduct(withDrop001DetailMedia(detail)))
      .catch(() => setError(true));
  }, [slug]);

  if (error) {
    return <p className="store-light bg-[#f6f3ee] px-4 py-24 text-center text-[#111]">Product not found.</p>;
  }

  if (!product) {
    return <div className="store-light min-h-[50vh] bg-[#f6f3ee]" />;
  }

  return (
    <StoreSurface>
      <div className="mx-auto grid max-w-[1600px] gap-12 px-4 py-10 md:grid-cols-2 md:px-8 md:py-16">
        <ProductGallery images={product.images} productName={product.name} />
        <ProductPurchase
          product={product}
          wishlisted={false}
          isAuthenticated={isAuthenticated}
          printNote={DROP_001_BY_SLUG[product.slug]?.tagline}
        />
      </div>
    </StoreSurface>
  );
}
