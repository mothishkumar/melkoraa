/**
 * Domain services. UI talks to these through Server Components,
 * Server Actions, or Route Handlers — never through Drizzle directly.
 */
export * as catalogProductService from "./catalog/product-service";
export * as catalogCategoryService from "./catalog/category-service";
export * as catalogCollectionService from "./catalog/collection-service";
export * as catalogDropService from "./catalog/drop-service";
export * as inventoryService from "./inventory/inventory-service";
export * as cartService from "./cart/cart-service";
export * as wishlistService from "./wishlist/wishlist-service";
export * as checkoutService from "./checkout/checkout-service";
export * as orderService from "./orders/order-service";
export * as paymentService from "./payments/payment-service";
export * as addressService from "./addresses/address-service";
export * as customerService from "./customers/customer-service";
export * as adminDashboardService from "./admin/dashboard-service";
