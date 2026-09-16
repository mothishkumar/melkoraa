import { paginationMeta } from "@/server/http";
import { conflictError, notFoundError } from "@/server/errors";
import { isUniqueViolation, uniqueConstraintMessage } from "@/server/api";
import { logger } from "@/lib/logger";
import { recordOperationalAudit } from "@/server/audit";
import { mapCollection } from "@/server/services/catalog/mappers";
import * as collectionRepo from "@/server/repositories/catalog/collection-repository";
import type { CollectionStatus } from "@/types";

function wrapUnique(error: unknown): never {
  if (isUniqueViolation(error)) {
    throw conflictError(
      "CONFLICT",
      uniqueConstraintMessage(error, "A collection with this slug already exists."),
    );
  }
  throw error;
}

export async function listPublicCollections(page: number, pageSize: number) {
  const { rows, total } = await collectionRepo.listPublicCollections(page, pageSize);
  return {
    data: rows.map(mapCollection),
    pagination: paginationMeta(page, pageSize, total),
  };
}

export async function listAdminCollections(page: number, pageSize: number) {
  const { rows, total } = await collectionRepo.listAdminCollections(page, pageSize);
  return {
    data: rows.map(mapCollection),
    pagination: paginationMeta(page, pageSize, total),
  };
}

export async function createCollection(
  input: {
    name: string;
    slug: string;
    description?: string | null;
    status?: CollectionStatus;
    heroImageUrl?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
  },
  actorId: string,
) {
  try {
    const row = await collectionRepo.insertCollection({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      status: input.status ?? "draft",
      heroImageUrl: input.heroImageUrl ?? null,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
    });
    logger.info("catalog.collection_created", { actorId, resourceId: row?.id });
    void recordOperationalAudit({
      actorId,
      action: "collection.created",
      entityType: "collection",
      entityId: row?.id ?? null,
    });
    return row ? mapCollection(row) : row;
  } catch (error) {
    wrapUnique(error);
  }
}

export async function updateCollection(
  id: string,
  input: Partial<{
    name: string;
    slug: string;
    description: string | null;
    status: CollectionStatus;
    heroImageUrl: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
  }>,
  actorId: string,
) {
  const existing = await collectionRepo.findCollectionById(id);
  if (!existing) {
    throw notFoundError("COLLECTION_NOT_FOUND", "Collection not found");
  }
  const fields = {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.heroImageUrl !== undefined ? { heroImageUrl: input.heroImageUrl } : {}),
    ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
    ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
  };
  try {
    const row = await collectionRepo.updateCollectionById(id, fields);
    logger.info("catalog.collection_updated", { actorId, resourceId: id });
    void recordOperationalAudit({
      actorId,
      action: "collection.updated",
      entityType: "collection",
      entityId: id,
    });
    return row ? mapCollection(row) : row;
  } catch (error) {
    wrapUnique(error);
  }
}

export async function archiveCollection(id: string, actorId: string) {
  const existing = await collectionRepo.findCollectionById(id);
  if (!existing) {
    throw notFoundError("COLLECTION_NOT_FOUND", "Collection not found");
  }
  const row = await collectionRepo.updateCollectionById(id, { status: "archived" });
  logger.info("catalog.collection_archived", { actorId, resourceId: id });
  void recordOperationalAudit({
    actorId,
    action: "collection.archived",
    entityType: "collection",
    entityId: id,
  });
  return row ? mapCollection(row) : row;
}
