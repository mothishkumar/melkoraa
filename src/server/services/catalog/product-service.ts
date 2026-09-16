import { getDb } from "@/db";
import { formatMoney } from "@/lib/catalog/money";
import { isNewProduct } from "@/lib/catalog/rules";
import {
  IMAGE_UPLOAD_CONSTRAINTS,
  STORAGE_BUCKETS,
  createSafeStorageFileName,
  isAllowedImageMimeType,
} from "@/lib/supabase/storage";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPublicEnv } from "@/lib/env/public";
import { logger } from "@/lib/logger";
import { recordOperationalAudit } from "@/server/audit";
import type { PublicProductQuery } from "@/lib/validation/catalog";
import type { CreateProductInput, UpdateProductInput } from "@/server/services/catalog/types";
import { AppError, conflictError, notFoundError, validationError } from "@/server/errors";
import { isUniqueViolation, uniqueConstraintMessage } from "@/server/api";
import { paginationMeta } from "@/server/http";
import * as productsRepo from "@/server/repositories/catalog/product-repository";
import { categoriesExist } from "@/server/repositories/catalog/category-repository";
import {
  mapCategory,
  mapDrop,
  mapEdition,
  mapImage,
  mapVariant,
  pickPrimaryImage,
} from "@/server/services/catalog/mappers";
import type { ProductDetail, ProductListItem } from "@/types/catalog";

function wrapUnique(error: unknown, fallback: string): never {
  if (isUniqueViolation(error)) {
    throw conflictError("CONFLICT", uniqueConstraintMessage(error, fallback));
  }
  throw error;
}

function publicImageUrl(storagePath: string): string {
  const env = getPublicEnv();
  return `${env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${STORAGE_BUCKETS.productImages}/${storagePath}`;
}

export async function listPublicProducts(query: PublicProductQuery) {
  if (query.collection) {
    const collection = await productsRepo.findActiveCollectionBySlug(query.collection);
    if (!collection) {
      return {
        data: [] as ProductListItem[],
        pagination: paginationMeta(query.page, query.pageSize, 0),
      };
    }
  }

  const { rows, total } = await productsRepo.listPublicProducts({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    categorySlug: query.categorySlug,
    dropSlug: query.drop,
    requireActiveDrop: Boolean(query.collection),
    isNew: query.isNew,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    sort: query.sort,
  });

  const ids = rows.map((row) => row.id);
  const [images, categoryRows, availability] = await Promise.all([
    productsRepo.listImagesForProducts(ids),
    productsRepo.listCategoriesForProducts(ids),
    productsRepo.listAvailabilityForProducts(ids),
  ]);

  const imagesByProduct = new Map<string, ReturnType<typeof mapImage>[]>();
  for (const image of images) {
    const list = imagesByProduct.get(image.productId) ?? [];
    list.push(mapImage(image));
    imagesByProduct.set(image.productId, list);
  }

  const categoriesByProduct = new Map<string, ReturnType<typeof mapCategory>[]>();
  for (const row of categoryRows) {
    const list = categoriesByProduct.get(row.productId) ?? [];
    list.push(mapCategory(row));
    categoriesByProduct.set(row.productId, list);
  }

  const availableByProduct = new Map(availability.map((row) => [row.productId, Boolean(row.available)]));

  const data: ProductListItem[] = rows.map((row) => {
    const productImages = imagesByProduct.get(row.id) ?? [];
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      shortDescription: row.shortDescription,
      basePrice: formatMoney(row.basePrice),
      compareAtPrice: row.compareAtPrice ? formatMoney(row.compareAtPrice) : null,
      isNew: isNewProduct(row.createdAt),
      available: availableByProduct.get(row.id) ?? false,
      primaryImage: pickPrimaryImage(productImages),
      categories: categoriesByProduct.get(row.id) ?? [],
    };
  });

  return { data, pagination: paginationMeta(query.page, query.pageSize, total) };
}

export async function getPublicProductBySlug(slug: string): Promise<ProductDetail> {
  const product = await productsRepo.findProductBySlug(slug);
  if (!product || product.status !== "active") {
    throw notFoundError("PRODUCT_NOT_FOUND", "Product not found");
  }

  const [images, categoryRows, variants, drop, editions] = await Promise.all([
    productsRepo.listImagesForProducts([product.id]),
    productsRepo.listCategoriesForProducts([product.id]),
    productsRepo.listVariantsWithAvailability(product.id),
    productsRepo.findPrimaryDropForProduct(product.id, true),
    productsRepo.listEditionsForProduct(product.id),
  ]);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    basePrice: formatMoney(product.basePrice),
    compareAtPrice: product.compareAtPrice ? formatMoney(product.compareAtPrice) : null,
    brand: product.brand,
    isNew: isNewProduct(product.createdAt),
    images: images.map(mapImage),
    variants: variants.filter((variant) => variant.isActive).map(mapVariant),
    categories: categoryRows.map(mapCategory),
    drop: drop ? mapDrop(drop) : null,
    edition: mapEdition(editions),
  };
}

export async function listAdminProducts(query: {
  page: number;
  pageSize: number;
  search?: string;
  status?: "draft" | "active" | "archived";
  sort: PublicProductQuery["sort"];
}) {
  const { rows, total } = await productsRepo.listAdminProducts(query);
  const ids = rows.map((row) => row.id);
  const [images, categoryRows, variantCounts] = await Promise.all([
    productsRepo.listImagesForProducts(ids),
    productsRepo.listCategoriesForProducts(ids),
    productsRepo.listVariantCountsForProducts(ids),
  ]);
  const imagesByProduct = new Map<string, ReturnType<typeof mapImage>[]>();
  for (const image of images) {
    const list = imagesByProduct.get(image.productId) ?? [];
    list.push(mapImage(image));
    imagesByProduct.set(image.productId, list);
  }
  const categoriesByProduct = new Map<string, ReturnType<typeof mapCategory>[]>();
  for (const row of categoryRows) {
    const list = categoriesByProduct.get(row.productId) ?? [];
    list.push(mapCategory(row));
    categoriesByProduct.set(row.productId, list);
  }
  const countByProduct = new Map(
    variantCounts.map((row) => [row.productId, Number(row.count)]),
  );

  return {
    data: rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      basePrice: formatMoney(row.basePrice),
      brand: row.brand,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      primaryImage: pickPrimaryImage(imagesByProduct.get(row.id) ?? []),
      categories: categoriesByProduct.get(row.id) ?? [],
      variantCount: countByProduct.get(row.id) ?? 0,
    })),
    pagination: paginationMeta(query.page, query.pageSize, total),
  };
}

export async function getAdminProduct(id: string) {
  const product = await productsRepo.findProductById(id);
  if (!product) {
    throw notFoundError("PRODUCT_NOT_FOUND", "Product not found");
  }

  const [images, categoryRows, variants, drop, editions] = await Promise.all([
    productsRepo.listImagesForProducts([product.id]),
    productsRepo.listCategoriesForProducts([product.id]),
    productsRepo.listVariantsWithAvailability(product.id),
    productsRepo.findPrimaryDropForProduct(product.id, false),
    productsRepo.listEditionsForProduct(product.id),
  ]);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    status: product.status,
    basePrice: formatMoney(product.basePrice),
    compareAtPrice: product.compareAtPrice ? formatMoney(product.compareAtPrice) : null,
    brand: product.brand,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    images: images.map(mapImage),
    variants: variants.map((row) => ({
      ...mapVariant(row),
      isActive: row.isActive,
    })),
    categories: categoryRows.map(mapCategory),
    drop: drop ? mapDrop(drop) : null,
    edition: mapEdition(editions),
  };
}

function productWriteFields(input: CreateProductInput | UpdateProductInput) {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.shortDescription !== undefined ? { shortDescription: input.shortDescription } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.basePrice !== undefined ? { basePrice: input.basePrice } : {}),
    ...(input.compareAtPrice !== undefined ? { compareAtPrice: input.compareAtPrice } : {}),
    ...(input.brand !== undefined ? { brand: input.brand } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
    ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
  };
}

export async function createProduct(input: CreateProductInput, actorId: string) {
  if (input.categoryIds && !(await categoriesExist(input.categoryIds))) {
    throw validationError("One or more categories were not found.");
  }

  const db = getDb();
  try {
    const product = await db.transaction(async (tx) => {
      const created = await productsRepo.insertProduct(
        {
          name: input.name,
          slug: input.slug,
          shortDescription: input.shortDescription ?? null,
          description: input.description ?? null,
          basePrice: input.basePrice,
          compareAtPrice: input.compareAtPrice ?? null,
          brand: input.brand ?? "MELKORAA",
          status: input.status ?? "draft",
          seoTitle: input.seoTitle ?? null,
          seoDescription: input.seoDescription ?? null,
        },
        tx,
      );
      if (!created) {
        throw new AppError("INTERNAL", "Unable to create product.", 500);
      }
      if (input.categoryIds?.length) {
        await productsRepo.replaceProductCategories(created.id, input.categoryIds, tx);
      }
      return created;
    });
    logger.info("catalog.product_created", { actorId, resourceId: product.id });
    void recordOperationalAudit({
      actorId,
      action: "product.created",
      entityType: "product",
      entityId: product.id,
    });
    return getAdminProduct(product.id);
  } catch (error) {
    wrapUnique(error, "A product with this slug already exists.");
  }
}

export async function updateProduct(id: string, input: UpdateProductInput, actorId: string) {
  const existing = await productsRepo.findProductById(id);
  if (!existing) {
    throw notFoundError("PRODUCT_NOT_FOUND", "Product not found");
  }
  if (input.categoryIds && !(await categoriesExist(input.categoryIds))) {
    throw validationError("One or more categories were not found.");
  }

  const db = getDb();
  try {
    await db.transaction(async (tx) => {
      const updated = await productsRepo.updateProductById(id, productWriteFields(input), tx);
      if (!updated) {
        throw notFoundError("PRODUCT_NOT_FOUND", "Product not found");
      }
      if (input.categoryIds) {
        await productsRepo.replaceProductCategories(id, input.categoryIds, tx);
      }
    });
    logger.info("catalog.product_updated", { actorId, resourceId: id });
    void recordOperationalAudit({
      actorId,
      action: "product.updated",
      entityType: "product",
      entityId: id,
    });
    return getAdminProduct(id);
  } catch (error) {
    wrapUnique(error, "A product with this slug already exists.");
  }
}

export async function archiveProduct(id: string, actorId: string) {
  const existing = await productsRepo.findProductById(id);
  if (!existing) {
    throw notFoundError("PRODUCT_NOT_FOUND", "Product not found");
  }
  await productsRepo.archiveProductById(id);
  logger.info("catalog.product_archived", { actorId, resourceId: id });
  void recordOperationalAudit({
    actorId,
    action: "product.archived",
    entityType: "product",
    entityId: id,
  });
  return getAdminProduct(id);
}

export async function createVariant(
  productId: string,
  input: {
    sku: string;
    size: string;
    color: string;
    colorCode?: string | null;
    price: string;
    compareAtPrice?: string | null;
    barcode?: string | null;
    isActive?: boolean;
  },
  actorId: string,
) {
  const product = await productsRepo.findProductById(productId);
  if (!product) {
    throw notFoundError("PRODUCT_NOT_FOUND", "Product not found");
  }

  const db = getDb();
  try {
    const variant = await db.transaction(async (tx) => {
      const created = await productsRepo.insertVariant(
        {
          productId,
          sku: input.sku,
          size: input.size,
          color: input.color,
          colorCode: input.colorCode ?? null,
          price: input.price,
          compareAtPrice: input.compareAtPrice ?? null,
          barcode: input.barcode ?? null,
          isActive: input.isActive ?? true,
        },
        tx,
      );
      if (!created) {
        throw new AppError("INTERNAL", "Unable to create variant.", 500);
      }
      await productsRepo.insertZeroInventory(created.id, tx);
      return created;
    });
    logger.info("catalog.variant_created", { actorId, resourceId: variant.id });
    return variant;
  } catch (error) {
    wrapUnique(error, "A variant with this SKU already exists.");
  }
}

export async function updateVariant(
  productId: string,
  variantId: string,
  input: Partial<{
    sku: string;
    size: string;
    color: string;
    colorCode: string | null;
    price: string;
    compareAtPrice: string | null;
    barcode: string | null;
    isActive: boolean;
  }>,
  actorId: string,
) {
  const variant = await productsRepo.findVariantById(variantId);
  if (!variant || variant.productId !== productId) {
    throw notFoundError("VARIANT_NOT_FOUND", "Variant not found");
  }

  const fields = {
    ...(input.sku !== undefined ? { sku: input.sku } : {}),
    ...(input.size !== undefined ? { size: input.size } : {}),
    ...(input.color !== undefined ? { color: input.color } : {}),
    ...(input.colorCode !== undefined ? { colorCode: input.colorCode } : {}),
    ...(input.price !== undefined ? { price: input.price } : {}),
    ...(input.compareAtPrice !== undefined ? { compareAtPrice: input.compareAtPrice } : {}),
    ...(input.barcode !== undefined ? { barcode: input.barcode } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  };

  try {
    const updated = await productsRepo.updateVariantById(variantId, fields);
    logger.info("catalog.variant_updated", { actorId, resourceId: variantId });
    return updated;
  } catch (error) {
    wrapUnique(error, "A variant with this SKU already exists.");
  }
}

export async function deactivateVariant(productId: string, variantId: string, actorId: string) {
  const variant = await productsRepo.findVariantById(variantId);
  if (!variant || variant.productId !== productId) {
    throw notFoundError("VARIANT_NOT_FOUND", "Variant not found");
  }
  const updated = await productsRepo.updateVariantById(variantId, { isActive: false });
  logger.info("catalog.variant_deactivated", { actorId, resourceId: variantId });
  return updated;
}

export async function addProductImage(
  productId: string,
  file: File,
  meta: {
    altText?: string | null;
    sortOrder?: number;
    imageType?: "primary" | "secondary" | "back" | "detail" | "lifestyle";
    variantId?: string | null;
  },
  actorId: string,
) {
  const product = await productsRepo.findProductById(productId);
  if (!product) {
    throw notFoundError("PRODUCT_NOT_FOUND", "Product not found");
  }
  if (file.size > IMAGE_UPLOAD_CONSTRAINTS.maxBytes) {
    throw validationError("Image exceeds the 5MB limit.");
  }
  if (!isAllowedImageMimeType(file.type)) {
    throw validationError("Use a JPEG, PNG, or WebP image.");
  }
  if (meta.variantId) {
    const variant = await productsRepo.findVariantById(meta.variantId);
    if (!variant || variant.productId !== productId) {
      throw validationError("Variant does not belong to this product.");
    }
  }

  const fileName = createSafeStorageFileName(file.name);
  const storagePath = `${productId}/${fileName}`;
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.productImages)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    logger.error("catalog.image_upload_failed");
    throw new AppError("UPLOAD_FAILED", "Unable to upload image.", 500);
  }

  try {
    const image = await productsRepo.insertImage({
      productId,
      variantId: meta.variantId ?? null,
      imageUrl: publicImageUrl(storagePath),
      storagePath,
      altText: meta.altText ?? null,
      imageType: meta.imageType ?? "secondary",
      sortOrder: meta.sortOrder ?? 0,
    });
    logger.info("catalog.image_created", { actorId, resourceId: image?.id });
    return image ? mapImage(image) : null;
  } catch (error) {
    await supabase.storage.from(STORAGE_BUCKETS.productImages).remove([storagePath]);
    throw error;
  }
}

export async function updateProductImage(
  productId: string,
  imageId: string,
  input: {
    altText?: string | null;
    sortOrder?: number;
    imageType?: "primary" | "secondary" | "back" | "detail" | "lifestyle";
    variantId?: string | null;
  },
  actorId: string,
) {
  const image = await productsRepo.findImageById(imageId);
  if (!image || image.productId !== productId) {
    throw notFoundError("IMAGE_NOT_FOUND", "Image not found");
  }
  if (input.variantId) {
    const variant = await productsRepo.findVariantById(input.variantId);
    if (!variant || variant.productId !== productId) {
      throw validationError("Variant does not belong to this product.");
    }
  }

  const fields = {
    ...(input.altText !== undefined ? { altText: input.altText } : {}),
    ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    ...(input.imageType !== undefined ? { imageType: input.imageType } : {}),
    ...(input.variantId !== undefined ? { variantId: input.variantId } : {}),
  };
  const updated = await productsRepo.updateImageById(imageId, fields);
  logger.info("catalog.image_updated", { actorId, resourceId: imageId });
  return updated ? mapImage(updated) : null;
}

export async function deleteProductImage(productId: string, imageId: string, actorId: string) {
  const image = await productsRepo.findImageById(imageId);
  if (!image || image.productId !== productId) {
    throw notFoundError("IMAGE_NOT_FOUND", "Image not found");
  }
  await productsRepo.deleteImageById(imageId);
  const supabase = await createServerSupabaseClient();
  await supabase.storage.from(STORAGE_BUCKETS.productImages).remove([image.storagePath]);
  logger.info("catalog.image_deleted", { actorId, resourceId: imageId });
}
