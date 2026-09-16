import type { ProductListItem, PublicVariant } from "@/src/api/types/catalog";

export function getProductImageUrl(product: ProductListItem): string | null {
  return product.primaryImage?.url ?? null;
}

export function getUniqueColors(variants: PublicVariant[]): string[] {
  const seen = new Set<string>();
  const colors: string[] = [];
  for (const variant of variants) {
    const key = variant.color.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      colors.push(variant.color);
    }
  }
  return colors;
}

export function getSizesForColor(
  variants: PublicVariant[],
  color: string,
): PublicVariant[] {
  return variants.filter(
    (variant) => variant.color.toLowerCase() === color.toLowerCase(),
  );
}

export function findVariant(
  variants: PublicVariant[],
  color: string,
  size: string,
): PublicVariant | undefined {
  return variants.find(
    (variant) =>
      variant.color.toLowerCase() === color.toLowerCase() &&
      variant.size.toLowerCase() === size.toLowerCase(),
  );
}

export const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low", value: "price_asc" },
  { label: "Price: High", value: "price_desc" },
  { label: "Name A–Z", value: "name_asc" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];
