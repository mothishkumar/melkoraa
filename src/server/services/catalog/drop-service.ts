import { paginationMeta } from "@/server/http";
import { conflictError, notFoundError } from "@/server/errors";
import { isUniqueViolation, uniqueConstraintMessage } from "@/server/api";
import { logger } from "@/lib/logger";
import { recordOperationalAudit } from "@/server/audit";
import { formatMoney } from "@/lib/catalog/money";
import { isNewProduct } from "@/lib/catalog/rules";
import { mapDrop } from "@/server/services/catalog/mappers";
import * as dropRepo from "@/server/repositories/catalog/drop-repository";
import { findProductById } from "@/server/repositories/catalog/product-repository";
import type { DropStatus } from "@/types";

function wrapUnique(error: unknown): never {
  if (isUniqueViolation(error)) {
    throw conflictError("CONFLICT", uniqueConstraintMessage(error, "A drop with this slug already exists."));
  }
  throw error;
}

function toDate(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
}

export async function listPublicDrops(page: number, pageSize: number) {
  const { rows, total } = await dropRepo.listPublicDrops(page, pageSize);
  return {
    data: rows.map(mapDrop),
    pagination: paginationMeta(page, pageSize, total),
  };
}

export async function getPublicDropBySlug(slug: string) {
  const drop = await dropRepo.findDropBySlug(slug);
  if (!drop || drop.status !== "active") {
    throw notFoundError("DROP_NOT_FOUND", "Drop not found");
  }
  const associated = await dropRepo.listDropProducts(drop.id, true);
  return {
    ...mapDrop(drop),
    products: associated.map((product) => ({
      id: product.productId,
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      basePrice: formatMoney(product.basePrice),
      compareAtPrice: product.compareAtPrice ? formatMoney(product.compareAtPrice) : null,
      isNew: isNewProduct(product.createdAt),
      displayOrder: product.displayOrder,
    })),
  };
}

export async function listAdminDrops(page: number, pageSize: number) {
  const { rows, total } = await dropRepo.listAdminDrops(page, pageSize);
  return {
    data: rows.map(mapDrop),
    pagination: paginationMeta(page, pageSize, total),
  };
}

export async function getAdminDrop(id: string) {
  const drop = await dropRepo.findDropById(id);
  if (!drop) {
    throw notFoundError("DROP_NOT_FOUND", "Drop not found");
  }
  const associated = await dropRepo.listDropProducts(drop.id, false);
  return {
    ...mapDrop(drop),
    products: associated.map((product) => ({
      id: product.productId,
      name: product.name,
      slug: product.slug,
      status: product.status,
      displayOrder: product.displayOrder,
    })),
  };
}

export async function createDrop(
  input: {
    name: string;
    slug: string;
    description?: string | null;
    status?: DropStatus;
    startAt?: string | null;
    endAt?: string | null;
    isLimited?: boolean;
    isNeverRestocked?: boolean;
  },
  actorId: string,
) {
  try {
    const row = await dropRepo.insertDrop({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      status: input.status ?? "draft",
      startAt: toDate(input.startAt) ?? null,
      endAt: toDate(input.endAt) ?? null,
      isLimited: input.isLimited ?? true,
      isNeverRestocked: input.isNeverRestocked ?? true,
    });
    logger.info("catalog.drop_created", { actorId, resourceId: row?.id });
    void recordOperationalAudit({
      actorId,
      action: "drop.created",
      entityType: "drop",
      entityId: row?.id ?? null,
    });
    return row ? mapDrop(row) : row;
  } catch (error) {
    wrapUnique(error);
  }
}

export async function updateDrop(
  id: string,
  input: Partial<{
    name: string;
    slug: string;
    description: string | null;
    status: DropStatus;
    startAt: string | null;
    endAt: string | null;
    isLimited: boolean;
    isNeverRestocked: boolean;
  }>,
  actorId: string,
) {
  const existing = await dropRepo.findDropById(id);
  if (!existing) {
    throw notFoundError("DROP_NOT_FOUND", "Drop not found");
  }
  const fields = {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.startAt !== undefined ? { startAt: toDate(input.startAt) ?? null } : {}),
    ...(input.endAt !== undefined ? { endAt: toDate(input.endAt) ?? null } : {}),
    ...(input.isLimited !== undefined ? { isLimited: input.isLimited } : {}),
    ...(input.isNeverRestocked !== undefined ? { isNeverRestocked: input.isNeverRestocked } : {}),
  };
  try {
    const row = await dropRepo.updateDropById(id, fields);
    logger.info("catalog.drop_updated", { actorId, resourceId: id });
    void recordOperationalAudit({
      actorId,
      action: "drop.updated",
      entityType: "drop",
      entityId: id,
    });
    return row ? mapDrop(row) : row;
  } catch (error) {
    wrapUnique(error);
  }
}

export async function archiveDrop(id: string, actorId: string) {
  const existing = await dropRepo.findDropById(id);
  if (!existing) {
    throw notFoundError("DROP_NOT_FOUND", "Drop not found");
  }
  const row = await dropRepo.updateDropById(id, { status: "archived" });
  logger.info("catalog.drop_archived", { actorId, resourceId: id });
  void recordOperationalAudit({
    actorId,
    action: "drop.archived",
    entityType: "drop",
    entityId: id,
  });
  return row ? mapDrop(row) : row;
}

export async function associateDropProduct(
  dropId: string,
  productId: string,
  displayOrder: number | undefined,
  actorId: string,
) {
  const drop = await dropRepo.findDropById(dropId);
  if (!drop) {
    throw notFoundError("DROP_NOT_FOUND", "Drop not found");
  }
  const product = await findProductById(productId);
  if (!product) {
    throw notFoundError("PRODUCT_NOT_FOUND", "Product not found");
  }
  await dropRepo.addProductToDrop(dropId, productId, displayOrder ?? 0);
  logger.info("catalog.drop_product_added", { actorId, resourceId: dropId });
  return getAdminDrop(dropId);
}

export async function dissociateDropProduct(dropId: string, productId: string, actorId: string) {
  const drop = await dropRepo.findDropById(dropId);
  if (!drop) {
    throw notFoundError("DROP_NOT_FOUND", "Drop not found");
  }
  const link = await dropRepo.findDropProduct(dropId, productId);
  if (!link) {
    throw notFoundError("DROP_PRODUCT_NOT_FOUND", "Product is not in this drop");
  }
  await dropRepo.removeProductFromDrop(dropId, productId);
  logger.info("catalog.drop_product_removed", { actorId, resourceId: dropId });
}
