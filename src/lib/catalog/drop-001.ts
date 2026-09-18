export const DROP_001_LEGACY_SLUGS = [
  "the-builder-oversized-t-shirt",
  "the-builder-heavyweight-hoodie",
  "the-builder-overshirt",
  "the-builder-cargo",
  "the-builder-cap",
] as const;

export const DROP_001_COLORS = {
  ivory: { name: "Ivory", code: "#F4F1EA", sku: "IVR" },
  black: { name: "Black", code: "#050505", sku: "BLK" },
  forest: { name: "Forest", code: "#1E2A22", sku: "FST" },
  grey: { name: "Grey", code: "#6E7176", sku: "GRY" },
  stone: { name: "Stone", code: "#A89F93", sku: "STN" },
  charcoal: { name: "Charcoal", code: "#2A2A2A", sku: "CHR" },
} as const;

export type Drop001ColorKey = keyof typeof DROP_001_COLORS;

export const DROP_001_SIZES = [
  { size: "S", qty: 15 },
  { size: "M", qty: 45 },
  { size: "L", qty: 53 },
  { size: "XL", qty: 30 },
  { size: "XXL", qty: 7 },
] as const;

const IDENTITY_DETAILS =
  "240 GSM cotton. Oversized dropped-shoulder fit. Screen print. Limited DROP 001 — never restocked.";
const MANIFESTO_DETAILS =
  "240 GSM cotton. Oversized dropped-shoulder fit. High-opacity screen print. Limited DROP 001 — never restocked.";

export const DROP_001_PRODUCTS = [
  {
    code: "01",
    line: "identity" as const,
    slug: "essential-oversized-tee",
    name: "Essential Oversized Tee",
    tagline: "Clean. Timeless. Everyday.",
    shortDescription: "The everyday builder tee. Left-chest mark. Quiet back type.",
    description: IDENTITY_DETAILS,
    price: "1499.00",
    skuPrefix: "MK-D1-ESS",
    colors: ["ivory", "black", "forest"] as const satisfies readonly Drop001ColorKey[],
    primaryColor: "ivory" as const satisfies Drop001ColorKey,
  },
  {
    code: "02",
    line: "identity" as const,
    slug: "signature-oversized-tee",
    name: "Signature Oversized Tee",
    tagline: "Our identity. Bolder together.",
    shortDescription: "The house mark, full back. People. Ideas. Progress. Together.",
    description: IDENTITY_DETAILS,
    price: "1499.00",
    skuPrefix: "MK-D1-SIG",
    colors: ["black", "ivory", "grey"] as const satisfies readonly Drop001ColorKey[],
    primaryColor: "black" as const satisfies Drop001ColorKey,
  },
  {
    code: "03",
    line: "identity" as const,
    slug: "statement-oversized-tee",
    name: "Statement Oversized Tee",
    tagline: "Bold ideas. Bigger tomorrow.",
    shortDescription: "Large geometric back graphic. Built for a brighter tomorrow.",
    description: IDENTITY_DETAILS,
    price: "1499.00",
    skuPrefix: "MK-D1-STA",
    colors: ["stone", "black", "ivory"] as const satisfies readonly Drop001ColorKey[],
    primaryColor: "stone" as const satisfies Drop001ColorKey,
  },
  {
    code: "04",
    line: "manifesto" as const,
    slug: "so-build-yourself-oversized-tee",
    name: "So Build Yourself Oversized Tee",
    tagline: "No one is coming.",
    shortDescription: "Oversized back type. Discipline. Clarity. Freedom.",
    description: MANIFESTO_DETAILS,
    price: "1699.00",
    skuPrefix: "MK-D1-SBY",
    colors: ["charcoal", "black", "ivory"] as const satisfies readonly Drop001ColorKey[],
    primaryColor: "charcoal" as const satisfies Drop001ColorKey,
  },
  {
    code: "05",
    line: "manifesto" as const,
    slug: "built-different-oversized-tee",
    name: "Built Different Oversized Tee",
    tagline: "Discipline today. A better tomorrow.",
    shortDescription: "Geometric back emblem. Become who you promised to be.",
    description: MANIFESTO_DETAILS,
    price: "1699.00",
    skuPrefix: "MK-D1-BLT",
    colors: ["black", "grey", "ivory"] as const satisfies readonly Drop001ColorKey[],
    primaryColor: "black" as const satisfies Drop001ColorKey,
  },
  {
    code: "06",
    line: "manifesto" as const,
    slug: "24-hours-oversized-tee",
    name: "24 Hours Oversized Tee",
    tagline: "Same 24. Different results.",
    shortDescription: "24:00 chest mark. Time-fragment back graphic.",
    description: MANIFESTO_DETAILS,
    price: "1699.00",
    skuPrefix: "MK-D1-24H",
    colors: ["black", "grey"] as const satisfies readonly Drop001ColorKey[],
    primaryColor: "black" as const satisfies Drop001ColorKey,
  },
] as const;

export type Drop001Product = (typeof DROP_001_PRODUCTS)[number];

export function drop001Sku(prefix: string, colorSku: string, size: string) {
  return `${prefix}-${colorSku}-${size}`;
}

export function listDrop001Skus() {
  return DROP_001_PRODUCTS.flatMap((product) =>
    product.colors.flatMap((colorKey) =>
      DROP_001_SIZES.map((entry) =>
        drop001Sku(product.skuPrefix, DROP_001_COLORS[colorKey].sku, entry.size),
      ),
    ),
  );
}
