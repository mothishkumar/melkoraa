import { describe, expect, it } from "vitest";

import { formatMoney, toMoneyString } from "@/lib/catalog/money";
import {
  isNewProduct,
  isValidSlug,
  normalizeCategoryFilter,
  normalizeSlug,
  NEW_PRODUCT_WINDOW_DAYS,
} from "@/lib/catalog/rules";
import {
  createProductSchema,
  parsePublicProductQuery,
  updateProductSchema,
  updateVariantSchema,
} from "@/lib/validation/catalog";
import { hasMinRole, hasStaffAccess, isAdmin, isManager } from "@/lib/auth/permissions";
import { isUniqueViolation, uniqueConstraintMessage, fieldErrorsFromZod } from "@/server/api";
import { paginationMeta } from "@/server/http";
import { withLocalProductImages } from "@/lib/catalog/local-product-images";
import { pickPrimaryImage } from "@/server/services/catalog/mappers";
import { z } from "zod";

describe("catalog query validation", () => {
  it("applies pagination defaults and rejects invalid page sizes", () => {
    const ok = parsePublicProductQuery({});
    expect(ok.page).toBe(1);
    expect(ok.pageSize).toBe(20);
    expect(ok.sort).toBe("newest");

    expect(() => parsePublicProductQuery({ page: "0" })).toThrow();
    expect(() => parsePublicProductQuery({ pageSize: "101" })).toThrow();
    expect(() => parsePublicProductQuery({ sort: "random" })).toThrow();
  });

  it("maps productType aliases onto category slugs", () => {
    const query = parsePublicProductQuery({ productType: "T_SHIRT" });
    expect(query.categorySlug).toBe("t-shirts");
    expect(normalizeCategoryFilter("hoodie")).toBe("hoodies");
    expect(normalizeCategoryFilter("cargo")).toBe("bottoms");
  });

  it("rejects inverted price ranges", () => {
    expect(() => parsePublicProductQuery({ minPrice: "3000", maxPrice: "1000" })).toThrow();
  });
});

describe("slugs and money", () => {
  it("normalizes slugs and rejects unsafe values", () => {
    expect(normalizeSlug(" The Builder Tee ")).toBe("the-builder-tee");
    expect(isValidSlug("the-builder-oversized-t-shirt")).toBe(true);
    expect(isValidSlug("../etc/passwd")).toBe(false);
  });

  it("formats money without float math on strings", () => {
    expect(toMoneyString("1499")).toBe("1499.00");
    expect(toMoneyString("1499.5")).toBe("1499.50");
    expect(formatMoney("2999.00")).toBe("2999.00");
  });
});

describe("mass assignment", () => {
  it("rejects client-controlled ids and timestamps", () => {
    const created = createProductSchema.safeParse({
      name: "Test",
      slug: "test-product",
      basePrice: "1499.00",
      id: "11111111-1111-4111-8111-111111111111",
      createdAt: "2020-01-01T00:00:00.000Z",
    });
    expect(created.success).toBe(false);

    const updated = updateProductSchema.safeParse({
      name: "Renamed",
      updatedAt: "2020-01-01T00:00:00.000Z",
    });
    expect(updated.success).toBe(false);

    const variant = updateVariantSchema.safeParse({
      productId: "11111111-1111-4111-8111-111111111111",
      size: "M",
    });
    expect(variant.success).toBe(false);
  });
});

describe("authorization matrix", () => {
  it("allows staff to read and managers/admins to mutate", () => {
    expect(hasStaffAccess("customer")).toBe(false);
    expect(hasStaffAccess("staff")).toBe(true);
    expect(isManager("staff")).toBe(false);
    expect(isManager("manager")).toBe(true);
    expect(isAdmin("admin")).toBe(true);
    expect(hasMinRole("staff", "staff")).toBe(true);
    expect(hasMinRole("staff", "manager")).toBe(false);
    expect(hasMinRole("customer", "staff")).toBe(false);
  });
});

describe("safe errors and pagination", () => {
  it("does not expose postgres text for unique violations", () => {
    expect(isUniqueViolation({ code: "23505", message: "duplicate key slug" })).toBe(true);
    expect(uniqueConstraintMessage({ message: "duplicate key value violates unique constraint products_slug_uidx" }, "fallback")).toBe(
      "A record with this slug already exists.",
    );
  });

  it("maps zod errors without leaking internals", () => {
    const parsed = z.object({ page: z.number().min(1) }).safeParse({ page: 0 });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const fields = fieldErrorsFromZod(parsed.error);
      expect(fields.page).toBeTruthy();
    }
  });

  it("computes total pages", () => {
    expect(paginationMeta(1, 20, 100)).toEqual({
      page: 1,
      pageSize: 20,
      total: 100,
      totalPages: 5,
    });
    expect(paginationMeta(1, 20, 0).totalPages).toBe(0);
  });
});

describe("image ordering", () => {
  it("prefers primary images then sort order", () => {
    const primary = pickPrimaryImage([
      {
        id: "2",
        url: "/b.jpg",
        alt: null,
        sortOrder: 0,
        imageType: "secondary",
        variantId: null,
      },
      {
        id: "1",
        url: "/a.jpg",
        alt: null,
        sortOrder: 3,
        imageType: "primary",
        variantId: null,
      },
    ]);
    expect(primary?.id).toBe("1");
  });

  it("fills DROP 001 product photos when the catalog has no images", () => {
    const filled = withLocalProductImages("the-builder-cap", []);
    expect(filled).toEqual([
      {
        id: "local-the-builder-cap",
        url: "/products/the-builder-cap.jpg",
        alt: "The Builder Cap",
        sortOrder: 0,
        imageType: "primary",
        variantId: null,
      },
    ]);

    const existing = [
      {
        id: "db-1",
        url: "https://cdn.example/cap.jpg",
        alt: null,
        sortOrder: 0,
        imageType: "primary" as const,
        variantId: null,
      },
    ];
    expect(withLocalProductImages("the-builder-cap", existing)).toBe(existing);
    expect(withLocalProductImages("unknown-slug", [])).toEqual([]);
  });
});

describe("new product window", () => {
  it(`treats products created within ${NEW_PRODUCT_WINDOW_DAYS} days as new`, () => {
    expect(isNewProduct(new Date())).toBe(true);
    expect(isNewProduct(new Date("2019-01-01T00:00:00.000Z"))).toBe(false);
  });
});
