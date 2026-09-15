/** New products are those created within this many days. Not a database column. */
export const NEW_PRODUCT_WINDOW_DAYS = 30;

export function isNewProduct(createdAt: Date, now = new Date()): boolean {
  const windowMs = NEW_PRODUCT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return now.getTime() - createdAt.getTime() <= windowMs;
}

export function newProductCutoff(now = new Date()): Date {
  return new Date(now.getTime() - NEW_PRODUCT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value) && value.length >= 2 && value.length <= 80;
}

export function escapeIlike(term: string): string {
  return term.replace(/[%_\\]/g, (char) => `\\${char}`);
}

/**
 * productType is not a database column. Public filters map aliases onto
 * category slugs (the canonical catalog taxonomy).
 */
const PRODUCT_TYPE_ALIASES: Record<string, string> = {
  t_shirt: "t-shirts",
  tshirt: "t-shirts",
  tshirts: "t-shirts",
  "t-shirt": "t-shirts",
  "t-shirts": "t-shirts",
  hoodie: "hoodies",
  hoodies: "hoodies",
  overshirt: "overshirts",
  overshirts: "overshirts",
  cargo: "bottoms",
  cargos: "bottoms",
  bottoms: "bottoms",
  cap: "accessories",
  caps: "accessories",
  accessories: "accessories",
};

export function normalizeCategoryFilter(input: string): string {
  const key = input.trim().toLowerCase().replace(/_/g, "-");
  return PRODUCT_TYPE_ALIASES[key] ?? key;
}

export const PUBLIC_DROP_STATUSES = ["active"] as const;
export const PUBLIC_COLLECTION_STATUSES = ["active"] as const;
export const PUBLIC_PRODUCT_STATUSES = ["active"] as const;
