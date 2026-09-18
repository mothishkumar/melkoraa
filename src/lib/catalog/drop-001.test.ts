import { describe, expect, it } from "vitest";

import { isValidSlug } from "@/lib/catalog/rules";
import {
  DROP_001_LEGACY_SLUGS,
  DROP_001_PRODUCTS,
  listDrop001Skus,
} from "@/lib/catalog/drop-001";

describe("DROP 001 production catalog", () => {
  it("ships six unique oversized tees with valid slugs", () => {
    const slugs = DROP_001_PRODUCTS.map((product) => product.slug);
    expect(slugs).toHaveLength(6);
    expect(new Set(slugs).size).toBe(6);
    for (const product of DROP_001_PRODUCTS) {
      expect(isValidSlug(product.slug)).toBe(true);
      expect(product.colors.length).toBeGreaterThan(0);
    }
  });

  it("keeps SKUs unique across colorways and sizes", () => {
    const skus = listDrop001Skus();
    expect(skus.length).toBeGreaterThan(50);
    expect(new Set(skus).size).toBe(skus.length);
  });

  it("archives the placeholder Builder SKUs instead of colliding with them", () => {
    const next = new Set<string>(DROP_001_PRODUCTS.map((product) => product.slug));
    for (const slug of DROP_001_LEGACY_SLUGS) {
      expect(next.has(slug)).toBe(false);
    }
  });
});
