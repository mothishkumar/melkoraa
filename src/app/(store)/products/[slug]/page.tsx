import type { Metadata } from "next";

import { notFound } from "next/navigation";

import { StoreSurface } from "@/components/layout/store-surface";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product/product-purchase";
import { getSiteUrl } from "@/lib/auth/site-url";
import { brand } from "@/lib/brand";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { notFoundIfMissing } from "@/lib/storefront/not-found";
import { getPublicProductBySlug } from "@/server/services/catalog/product-service";
import { getWishlist } from "@/server/services/wishlist/wishlist-service";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getPublicProductBySlug(slug);
    const description = product.shortDescription ?? product.description ?? brand.tagline;
    return {
      title: product.name,
      description,
      openGraph: {
        title: `${product.name} — ${brand.name}`,
        description,
        url: getSiteUrl(),
        images: product.images[0]?.url ? [{ url: product.images[0].url }] : undefined,
      },
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  let product;
  try {
    product = await getPublicProductBySlug(slug);
  } catch (error) {
    notFoundIfMissing(error);
  }
  if (!product) notFound();
  const user = await getCurrentUser();
  let wishlisted = false;
  if (user) {
    const wishlist = await getWishlist(user.id);
    wishlisted = wishlist.items.some((item) => item.productId === product.id);
  }

  return (
    <StoreSurface>
      <div className="mx-auto grid max-w-[1600px] gap-12 px-4 py-10 md:grid-cols-2 md:px-8 md:py-16">
        <ProductGallery images={product.images} productName={product.name} />
        <ProductPurchase
          product={product}
          wishlisted={wishlisted}
          isAuthenticated={Boolean(user)}
        />
      </div>
    </StoreSurface>
  );
}
