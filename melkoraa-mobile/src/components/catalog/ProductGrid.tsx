import { FlatList, RefreshControl, StyleSheet, View, type ListRenderItem } from "react-native";

import type { ProductListItem } from "@/src/api/types/catalog";
import { ProductCard } from "@/src/components/catalog/ProductCard";
import { ProductCardSkeleton } from "@/src/components/ui/Skeleton";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { colors, layout, spacing } from "@/src/theme";

type ProductGridProps = {
  products: ProductListItem[];
  loading?: boolean;
  refreshing?: boolean;
  loadingMore?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onRetry?: () => void;
  onWishlistPress?: (product: ProductListItem) => void;
  isWishlisted?: (productId: string) => boolean;
  showWishlist?: boolean;
  ListHeaderComponent?: React.ReactElement | null;
};

export function ProductGrid({
  products,
  loading = false,
  refreshing = false,
  loadingMore = false,
  error = null,
  onRefresh,
  onEndReached,
  onRetry,
  onWishlistPress,
  isWishlisted,
  showWishlist = true,
  ListHeaderComponent,
}: ProductGridProps) {
  if (loading && products.length === 0) {
    return (
      <View style={styles.skeletonGrid}>
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index} style={styles.skeletonItem}>
            <ProductCardSkeleton />
          </View>
        ))}
      </View>
    );
  }

  if (error && products.length === 0) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  const renderItem: ListRenderItem<ProductListItem> = ({ item }) => (
    <View style={styles.item}>
      <ProductCard
        product={item}
        showWishlist={showWishlist}
        wishlistActive={isWishlisted?.(item.id) ?? false}
        onWishlistPress={() => onWishlistPress?.(item)}
      />
    </View>
  );

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      renderItem={renderItem}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        !loading ? <EmptyState title="No pieces found" message="Try adjusting your search or filters." /> : null
      }
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
        ) : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footer}>
            <ProductCardSkeleton />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  row: {
    gap: layout.productCardGap,
  },
  item: {
    flex: 1,
    marginBottom: spacing.lg,
  },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: layout.screenPadding,
    gap: layout.productCardGap,
  },
  skeletonItem: {
    width: "47%",
  },
  footer: {
    paddingVertical: spacing.lg,
  },
});
