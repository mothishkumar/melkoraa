export type CreateProductInput = {
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  basePrice: string;
  compareAtPrice?: string | null;
  brand?: string;
  status?: "draft" | "active" | "archived";
  seoTitle?: string | null;
  seoDescription?: string | null;
  categoryIds?: string[];
};

export type UpdateProductInput = Partial<CreateProductInput>;
