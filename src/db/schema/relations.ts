import { relations } from "drizzle-orm";

import { addresses, profiles } from "./profiles";
import {
  categories,
  dropProducts,
  drops,
  productCategories,
  productEditions,
  productImages,
  products,
  productVariants,
} from "./catalog";
import { inventory, inventoryTransactions } from "./inventory";
import { cartItems, carts, wishlistItems, wishlists } from "./cart";
import {
  couponUsages,
  coupons,
  orderItems,
  orderStatusHistory,
  orders,
  payments,
  reviews,
} from "./commerce";

export const profilesRelations = relations(profiles, ({ many }) => ({
  addresses: many(addresses),
  carts: many(carts),
  wishlists: many(wishlists),
  orders: many(orders),
  reviews: many(reviews),
}));

export const productsRelations = relations(products, ({ many }) => ({
  variants: many(productVariants),
  images: many(productImages),
  categories: many(productCategories),
  dropProducts: many(dropProducts),
  editions: many(productEditions),
  reviews: many(reviews),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  inventory: one(inventory, {
    fields: [productVariants.id],
    references: [inventory.variantId],
  }),
  images: many(productImages),
  transactions: many(inventoryTransactions),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(productCategories),
}));

export const productCategoriesRelations = relations(productCategories, ({ one }) => ({
  product: one(products, {
    fields: [productCategories.productId],
    references: [products.id],
  }),
  category: one(categories, {
    fields: [productCategories.categoryId],
    references: [categories.id],
  }),
}));

export const dropsRelations = relations(drops, ({ many }) => ({
  products: many(dropProducts),
}));

export const dropProductsRelations = relations(dropProducts, ({ one }) => ({
  drop: one(drops, {
    fields: [dropProducts.dropId],
    references: [drops.id],
  }),
  product: one(products, {
    fields: [dropProducts.productId],
    references: [products.id],
  }),
}));

export const cartsRelations = relations(carts, ({ many }) => ({
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));

export const wishlistsRelations = relations(wishlists, ({ many }) => ({
  items: many(wishlistItems),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  wishlist: one(wishlists, {
    fields: [wishlistItems.wishlistId],
    references: [wishlists.id],
  }),
  product: one(products, {
    fields: [wishlistItems.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
  payments: many(payments),
  statusHistory: many(orderStatusHistory),
  reviews: many(reviews),
  couponUsages: many(couponUsages),
}));

export const couponsRelations = relations(coupons, ({ many }) => ({
  usages: many(couponUsages),
}));
