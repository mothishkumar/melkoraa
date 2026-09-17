import type {
  CollectionStatus,
  DropStatus,
  ProductImageType,
  ProductStatus,
} from "@/types";

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type PublicCollection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: CollectionStatus;
  heroImageUrl: string | null;
};

export type PublicDropSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: DropStatus;
  startAt: string | null;
  endAt: string | null;
  isLimited: boolean;
  isNeverRestocked: boolean;
};

export type PublicImage = {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  imageType: ProductImageType;
  variantId: string | null;
};

export type PublicVariant = {
  id: string;
  sku: string;
  size: string;
  color: string;
  colorCode: string | null;
  price: string;
  compareAtPrice: string | null;
  available: boolean;
};

export type PublicEdition = {
  editionNumber: number;
  editionSize: number;
  label: string;
};

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  basePrice: string;
  compareAtPrice: string | null;
  isNew: boolean;
  available: boolean;
  primaryImage: PublicImage | null;
  categories: PublicCategory[];
  variants: PublicVariant[];
};

export type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  basePrice: string;
  compareAtPrice: string | null;
  brand: string;
  isNew: boolean;
  images: PublicImage[];
  variants: PublicVariant[];
  categories: PublicCategory[];
  drop: PublicDropSummary | null;
  edition: PublicEdition | null;
};

export type AdminProductListItem = {
  id: string;
  name: string;
  slug: string;
  status: ProductStatus;
  basePrice: string;
  brand: string;
  createdAt: string;
  updatedAt: string;
  primaryImage: PublicImage | null;
  categories: PublicCategory[];
  variantCount: number;
};

export type AdminVariant = PublicVariant & {
  isActive: boolean;
  barcode: string | null;
};

export type AdminProductDetail = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  status: ProductStatus;
  basePrice: string;
  compareAtPrice: string | null;
  brand: string;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
  images: PublicImage[];
  variants: AdminVariant[];
  categories: PublicCategory[];
  drop: PublicDropSummary | null;
  edition: PublicEdition | null;
};
