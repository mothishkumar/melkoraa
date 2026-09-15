export const STORAGE_BUCKETS = {
  productImages: "product-images",
  brandAssets: "brand-assets",
  avatars: "avatars",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export const IMAGE_UPLOAD_CONSTRAINTS = {
  maxBytes: 5 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
} as const;

export function isAllowedImageMimeType(mimeType: string): boolean {
  return IMAGE_UPLOAD_CONSTRAINTS.allowedMimeTypes.includes(
    mimeType as (typeof IMAGE_UPLOAD_CONSTRAINTS.allowedMimeTypes)[number],
  );
}

export function createSafeStorageFileName(originalName: string): string {
  const extension = originalName.split(".").pop()?.toLowerCase() ?? "bin";
  const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "bin";
  const unique = crypto.randomUUID();
  return `${unique}.${safeExtension}`;
}

export function buildStoragePath(
  bucket: StorageBucket,
  folder: string,
  fileName: string,
): string {
  const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, "").replace(/^\/+|\/+$/g, "");
  return `${bucket}/${safeFolder}/${fileName}`;
}
