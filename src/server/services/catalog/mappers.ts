import { formatMoney } from "@/lib/catalog/money";
import { isNewProduct } from "@/lib/catalog/rules";
import type {
  PublicCategory,
  PublicCollection,
  PublicDropSummary,
  PublicEdition,
  PublicImage,
  PublicVariant,
} from "@/types/catalog";

export function mapCategory(row: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}): PublicCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
  };
}

export function mapCollection(row: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: PublicCollection["status"];
  heroImageUrl: string | null;
}): PublicCollection {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    status: row.status,
    heroImageUrl: row.heroImageUrl,
  };
}

export function mapDrop(row: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: PublicDropSummary["status"];
  startAt: Date | null;
  endAt: Date | null;
  isLimited: boolean;
  isNeverRestocked: boolean;
}): PublicDropSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    status: row.status,
    startAt: row.startAt ? row.startAt.toISOString() : null,
    endAt: row.endAt ? row.endAt.toISOString() : null,
    isLimited: row.isLimited,
    isNeverRestocked: row.isNeverRestocked,
  };
}

export function mapImage(row: {
  id: string;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
  imageType: PublicImage["imageType"];
  variantId: string | null;
}): PublicImage {
  return {
    id: row.id,
    url: row.imageUrl,
    alt: row.altText,
    sortOrder: row.sortOrder,
    imageType: row.imageType,
    variantId: row.variantId,
  };
}

export function pickPrimaryImage(images: PublicImage[]): PublicImage | null {
  return (
    images.find((image) => image.imageType === "primary") ??
    [...images].sort((a, b) => a.sortOrder - b.sortOrder)[0] ??
    null
  );
}

export function mapVariant(row: {
  id: string;
  sku: string;
  size: string;
  color: string;
  colorCode: string | null;
  price: string;
  compareAtPrice: string | null;
  available: boolean;
  isActive?: boolean;
}): PublicVariant {
  return {
    id: row.id,
    sku: row.sku,
    size: row.size,
    color: row.color,
    colorCode: row.colorCode,
    price: formatMoney(row.price),
    compareAtPrice: row.compareAtPrice ? formatMoney(row.compareAtPrice) : null,
    available: Boolean(row.available) && row.isActive !== false,
  };
}

export function mapEdition(rows: { editionNumber: number; editionSize: number }[]): PublicEdition | null {
  if (rows.length === 0) return null;
  const size = rows[0]!.editionSize;
  return {
    editionNumber: rows[0]!.editionNumber,
    editionSize: size,
    label: `${rows.length} / ${size}`,
  };
}

export function mapIsNew(createdAt: Date) {
  return isNewProduct(createdAt);
}
