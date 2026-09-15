import type { PublicImage } from "@/types/catalog";

export const LOCAL_DROP_001_IMAGES: Record<string, { url: string; alt: string }> = {
  "the-builder-oversized-t-shirt": {
    url: "/products/the-builder-oversized-t-shirt.jpg",
    alt: "The Builder Oversized T-Shirt",
  },
  "the-builder-heavyweight-hoodie": {
    url: "/products/the-builder-hoodie.jpg",
    alt: "The Builder Heavyweight Hoodie",
  },
  "the-builder-overshirt": {
    url: "/products/the-builder-overshirt.jpg",
    alt: "The Builder Overshirt",
  },
  "the-builder-cargo": {
    url: "/products/the-builder-cargo.jpg",
    alt: "The Builder Cargo",
  },
  "the-builder-cap": {
    url: "/products/the-builder-cap.jpg",
    alt: "The Builder Cap",
  },
};

export function withLocalProductImages(slug: string, images: PublicImage[]): PublicImage[] {
  if (images.length > 0) {
    return images;
  }

  const local = LOCAL_DROP_001_IMAGES[slug];
  if (!local) {
    return images;
  }

  return [
    {
      id: `local-${slug}`,
      url: local.url,
      alt: local.alt,
      sortOrder: 0,
      imageType: "primary",
      variantId: null,
    },
  ];
}
