import { requireApiManager } from "@/lib/auth/api-guard";
import { handleApi } from "@/server/api";
import { jsonOk } from "@/server/http";
import { validationError } from "@/server/errors";
import { imageTypeSchema, uuidSchema } from "@/lib/validation/catalog";
import { addProductImage } from "@/server/services/catalog/product-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiManager();
  if (!auth.ok) return auth.response;

  return handleApi(async () => {
    const { id } = await context.params;
    uuidSchema.parse(id);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw validationError("An image file is required.");
    }
    const altText = form.get("altText");
    const sortOrderRaw = form.get("sortOrder");
    const imageTypeRaw = form.get("imageType");
    const variantIdRaw = form.get("variantId");
    const image = await addProductImage(
      id,
      file,
      {
        altText: typeof altText === "string" ? altText : undefined,
        sortOrder: typeof sortOrderRaw === "string" ? Number(sortOrderRaw) : undefined,
        imageType:
          typeof imageTypeRaw === "string" ? imageTypeSchema.parse(imageTypeRaw) : undefined,
        variantId:
          typeof variantIdRaw === "string" && variantIdRaw.length > 0
            ? uuidSchema.parse(variantIdRaw)
            : undefined,
      },
      auth.user.id,
    );
    return jsonOk(image, 201);
  });
}
