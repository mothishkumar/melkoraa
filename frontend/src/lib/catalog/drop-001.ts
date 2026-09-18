import type { ProductDetail, ProductListItem, PublicImage } from "@/types/catalog";

export const DROP_001_COLORS = {
  ivory: { name: "Ivory", code: "#F4F1EA", sku: "IVR" },
  black: { name: "Black", code: "#050505", sku: "BLK" },
  forest: { name: "Forest", code: "#1E2A22", sku: "FST" },
  grey: { name: "Grey", code: "#6E7176", sku: "GRY" },
  stone: { name: "Stone", code: "#A89F93", sku: "STN" },
  charcoal: { name: "Charcoal", code: "#2A2A2A", sku: "CHR" },
} as const;

export type Drop001ColorKey = keyof typeof DROP_001_COLORS;

export const DROP_001_PRODUCTS = [
  {
    code: "01",
    line: "identity" as const,
    slug: "essential-oversized-tee",
    name: "Essential Oversized Tee",
    tagline: "Clean. Timeless. Everyday.",
    theme: "light" as const,
    colors: ["ivory", "black", "forest"] as const satisfies readonly Drop001ColorKey[],
    images: {
      front: "/catalog/essential-ivory-front.png",
      back: "/catalog/essential-ivory-back.png",
    },
    printFiles: ["/print/essential-chest.svg", "/print/essential-back.svg"],
  },
  {
    code: "02",
    line: "identity" as const,
    slug: "signature-oversized-tee",
    name: "Signature Oversized Tee",
    tagline: "Our identity. Bolder together.",
    theme: "dark" as const,
    colors: ["black", "ivory", "grey"] as const satisfies readonly Drop001ColorKey[],
    images: {
      front: "/catalog/signature-black-front.png",
      back: "/catalog/signature-black-back.png",
    },
    printFiles: ["/print/signature-back.svg"],
  },
  {
    code: "03",
    line: "identity" as const,
    slug: "statement-oversized-tee",
    name: "Statement Oversized Tee",
    tagline: "Bold ideas. Bigger tomorrow.",
    theme: "stone" as const,
    colors: ["stone", "black", "ivory"] as const satisfies readonly Drop001ColorKey[],
    images: {
      front: "/catalog/statement-stone-front.png",
      back: "/catalog/statement-stone-back.png",
    },
    printFiles: ["/print/statement-back.svg"],
  },
  {
    code: "04",
    line: "manifesto" as const,
    slug: "so-build-yourself-oversized-tee",
    name: "So Build Yourself Oversized Tee",
    tagline: "No one is coming.",
    theme: "dark" as const,
    colors: ["charcoal", "black", "ivory"] as const satisfies readonly Drop001ColorKey[],
    images: {
      front: "/catalog/so-build-yourself-front.png",
      back: "/catalog/so-build-yourself-back.png",
    },
    printFiles: ["/print/so-build-yourself-back.svg"],
  },
  {
    code: "05",
    line: "manifesto" as const,
    slug: "built-different-oversized-tee",
    name: "Built Different Oversized Tee",
    tagline: "Discipline today. A better tomorrow.",
    theme: "dark" as const,
    colors: ["black", "grey", "ivory"] as const satisfies readonly Drop001ColorKey[],
    images: {
      front: "/catalog/built-different-front.png",
      back: "/catalog/built-different-back.png",
    },
    printFiles: ["/print/built-different-back.svg"],
  },
  {
    code: "06",
    line: "manifesto" as const,
    slug: "24-hours-oversized-tee",
    name: "24 Hours Oversized Tee",
    tagline: "Same 24. Different results.",
    theme: "dark" as const,
    colors: ["black", "grey"] as const satisfies readonly Drop001ColorKey[],
    images: {
      front: "/catalog/hours-24-front.png",
      back: "/catalog/hours-24-back.png",
    },
    printFiles: ["/print/hours-24-front.svg", "/print/hours-24-back.svg"],
  },
] as const;

export type Drop001Style = (typeof DROP_001_PRODUCTS)[number];

export const DROP_001_BY_SLUG = Object.fromEntries(
  DROP_001_PRODUCTS.map((product) => [product.slug, product]),
) as Record<string, Drop001Style>;

function catalogImages(style: Drop001Style): PublicImage[] {
  return [
    {
      id: `${style.slug}-front`,
      url: style.images.front,
      alt: `${style.name} front`,
      sortOrder: 0,
      imageType: "primary",
      variantId: null,
    },
    {
      id: `${style.slug}-back`,
      url: style.images.back,
      alt: `${style.name} back`,
      sortOrder: 1,
      imageType: "back",
      variantId: null,
    },
  ];
}

export function withDrop001ListMedia(product: ProductListItem): ProductListItem {
  const style = DROP_001_BY_SLUG[product.slug];
  if (!style) return product;
  const images = catalogImages(style);
  return { ...product, primaryImage: product.primaryImage ?? images[0] ?? null };
}

export function withDrop001DetailMedia(product: ProductDetail): ProductDetail {
  const style = DROP_001_BY_SLUG[product.slug];
  if (!style) return product;
  const fallback = catalogImages(style);
  const existing = product.images.filter((image) => image.url);
  return {
    ...product,
    images: existing.length > 0 ? existing : fallback,
  };
}
