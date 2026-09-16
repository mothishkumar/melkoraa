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
  status: string;
  heroImageUrl: string | null;
};

export type PublicDropSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
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
  imageType: string;
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

export type ProductListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  productType?: string;
  collection?: string;
  drop?: string;
  isNew?: boolean;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
};
