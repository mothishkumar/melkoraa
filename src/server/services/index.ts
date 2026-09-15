/**
 * Domain services. UI talks to these through Server Components,
 * Server Actions, or Route Handlers — never through Drizzle directly.
 */
export * as catalogProductService from "./catalog/product-service";
export * as catalogCategoryService from "./catalog/category-service";
export * as catalogCollectionService from "./catalog/collection-service";
export * as catalogDropService from "./catalog/drop-service";
export * as inventoryService from "./inventory/inventory-service";
