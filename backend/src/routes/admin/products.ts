import { Router } from "express";
import multer from "multer";

import { validationError } from "@/server/errors";
import {
  adminProductQuerySchema,
  createProductSchema,
  createVariantSchema,
  imageTypeSchema,
  updateImageSchema,
  updateProductSchema,
  updateVariantSchema,
  uuidSchema,
} from "@/lib/validation/catalog";
import {
  addProductImage,
  archiveProduct,
  createProduct,
  createVariant,
  deactivateVariant,
  deleteProductImage,
  getAdminProduct,
  listAdminProducts,
  updateProduct,
  updateProductImage,
  updateVariant,
} from "@/server/services/catalog/product-service";

import { asyncHandler, handleRoute } from "../../lib/handle-route.js";
import { sendJson, sendPage } from "../../lib/express-response.js";
import { searchParamsRecord as expressQuery } from "../../lib/query.js";
import { mutationRateLimitExpress } from "../../lib/rate-limit-express.js";
import { requireManager, requireStaff } from "../../middleware/admin-guard.js";
import { param } from "../../lib/params.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const adminProductsRouter = Router();

adminProductsRouter.get(
  "/",
  requireStaff,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const query = adminProductQuerySchema.parse(expressQuery(req.query as Record<string, unknown>));
      const result = await listAdminProducts(query);
      sendPage(res, result.data, result.pagination);
    });
  }),
);

adminProductsRouter.post(
  "/",
  requireManager,
  asyncHandler(async (req, res) => {
    if (!req.auth?.user) return;
    if (!mutationRateLimitExpress(req, res, "admin.products", req.auth.user.id, 30)) return;
    await handleRoute(res, async () => {
      const body = createProductSchema.parse(req.body);
      const product = await createProduct(body, req.auth!.user.id);
      sendJson(res, product, 201);
    });
  }),
);

const productRouter = Router({ mergeParams: true });

productRouter.get(
  "/",
  requireStaff,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const id = uuidSchema.parse(param(req.params.id));
      const product = await getAdminProduct(id);
      sendJson(res, product);
    });
  }),
);

productRouter.patch(
  "/",
  requireManager,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const id = uuidSchema.parse(param(req.params.id));
      const body = updateProductSchema.parse(req.body);
      const product = await updateProduct(id, body, req.auth!.user.id);
      sendJson(res, product);
    });
  }),
);

productRouter.delete(
  "/",
  requireManager,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const id = uuidSchema.parse(param(req.params.id));
      const product = await archiveProduct(id, req.auth!.user.id);
      sendJson(res, product);
    });
  }),
);

productRouter.post(
  "/variants",
  requireManager,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const id = uuidSchema.parse(param(req.params.id));
      const body = createVariantSchema.parse(req.body);
      const variant = await createVariant(id, body, req.auth!.user.id);
      sendJson(res, variant, 201);
    });
  }),
);

productRouter.patch(
  "/variants/:variantId",
  requireManager,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const id = uuidSchema.parse(param(req.params.id));
      const variantId = uuidSchema.parse(param(req.params.variantId));
      const body = updateVariantSchema.parse(req.body);
      const variant = await updateVariant(id, variantId, body, req.auth!.user.id);
      sendJson(res, variant);
    });
  }),
);

productRouter.delete(
  "/variants/:variantId",
  requireManager,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const id = uuidSchema.parse(param(req.params.id));
      const variantId = uuidSchema.parse(param(req.params.variantId));
      const variant = await deactivateVariant(id, variantId, req.auth!.user.id);
      sendJson(res, variant);
    });
  }),
);

productRouter.post(
  "/images",
  requireManager,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const id = uuidSchema.parse(param(req.params.id));
      const file = req.file;
      if (!file || file.size === 0) {
        throw validationError("An image file is required.");
      }
      const webFile = new File([file.buffer], file.originalname, { type: file.mimetype });
      const altText = req.body.altText;
      const sortOrderRaw = req.body.sortOrder;
      const imageTypeRaw = req.body.imageType;
      const variantIdRaw = req.body.variantId;
      const image = await addProductImage(
        id,
        webFile,
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
        req.auth!.user.id,
      );
      sendJson(res, image, 201);
    });
  }),
);

productRouter.patch(
  "/images/:imageId",
  requireManager,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const id = uuidSchema.parse(param(req.params.id));
      const imageId = uuidSchema.parse(param(req.params.imageId));
      const body = updateImageSchema.parse(req.body);
      const image = await updateProductImage(id, imageId, body, req.auth!.user.id);
      sendJson(res, image);
    });
  }),
);

productRouter.delete(
  "/images/:imageId",
  requireManager,
  asyncHandler(async (req, res) => {
    await handleRoute(res, async () => {
      const id = uuidSchema.parse(param(req.params.id));
      const imageId = uuidSchema.parse(param(req.params.imageId));
      await deleteProductImage(id, imageId, req.auth!.user.id);
      res.status(204).end();
    });
  }),
);

adminProductsRouter.use("/:id", productRouter);
