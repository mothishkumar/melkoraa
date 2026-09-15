import { paginationMeta } from "@/server/http";
import { conflictError, notFoundError, validationError } from "@/server/errors";
import { isUniqueViolation, uniqueConstraintMessage } from "@/server/api";
import { logger } from "@/lib/logger";
import { mapCategory } from "@/server/services/catalog/mappers";
import * as categoryRepo from "@/server/repositories/catalog/category-repository";

function wrapUnique(error: unknown): never {
  if (isUniqueViolation(error)) {
    throw conflictError("CONFLICT", uniqueConstraintMessage(error, "A category with this slug already exists."));
  }
  throw error;
}

export async function listPublicCategories(page: number, pageSize: number) {
  const { rows, total } = await categoryRepo.listCategories(page, pageSize);
  return {
    data: rows.map(mapCategory),
    pagination: paginationMeta(page, pageSize, total),
  };
}

export const listAdminCategories = listPublicCategories;

export async function createCategory(
  input: { name: string; slug: string; description?: string | null },
  actorId: string,
) {
  try {
    const row = await categoryRepo.insertCategory({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
    });
    logger.info("catalog.category_created", { actorId, resourceId: row?.id });
    return row ? mapCategory(row) : row;
  } catch (error) {
    wrapUnique(error);
  }
}

export async function updateCategory(
  id: string,
  input: Partial<{ name: string; slug: string; description: string | null }>,
  actorId: string,
) {
  const existing = await categoryRepo.findCategoryById(id);
  if (!existing) {
    throw notFoundError("CATEGORY_NOT_FOUND", "Category not found");
  }
  const fields = {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
  };
  try {
    const row = await categoryRepo.updateCategoryById(id, fields);
    logger.info("catalog.category_updated", { actorId, resourceId: id });
    return row ? mapCategory(row) : row;
  } catch (error) {
    wrapUnique(error);
  }
}

export async function deleteCategory(id: string, actorId: string) {
  const existing = await categoryRepo.findCategoryById(id);
  if (!existing) {
    throw notFoundError("CATEGORY_NOT_FOUND", "Category not found");
  }
  const assigned = await categoryRepo.countProductsInCategory(id);
  if (assigned > 0) {
    throw validationError("Remove this category from products before deleting it.");
  }
  await categoryRepo.deleteCategoryById(id);
  logger.info("catalog.category_deleted", { actorId, resourceId: id });
}
