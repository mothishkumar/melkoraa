import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { ProductGrid } from "@/src/components/catalog/ProductGrid";
import { CategoryRow } from "@/src/components/catalog/CategoryRow";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { SafeScreen } from "@/src/components/ui/SafeScreen";
import { Chip } from "@/src/components/ui/Chip";
import { AppText } from "@/src/components/ui/AppText";
import { useProductList } from "@/src/hooks/use-products";
import { useCategories } from "@/src/hooks/use-categories";
import { useWishlistContext } from "@/src/providers/wishlist-provider";
import { SORT_OPTIONS, type SortValue } from "@/src/utils/product";
import { layout, spacing } from "@/src/theme";

export default function ShopScreen() {
  const [category, setCategory] = useState<string | undefined>();
  const [sort, setSort] = useState<SortValue>("newest");
  const { categories } = useCategories();
  const { items, loading, refreshing, loadingMore, error, refresh, loadMore } = useProductList({
    category,
    sort,
  });
  const { isSaved, toggle } = useWishlistContext();

  const sortHeader = (
    <View>
      <CategoryRow
        categories={categories}
        selectedSlug={category}
        onSelect={setCategory}
      />
      <View style={styles.sortRow}>
        <AppText variant="label" muted>Sort</AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {SORT_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={sort === option.value}
              onPress={() => setSort(option.value)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <SafeScreen padded={false} edges={["top"]}>
      <AppHeader title="Shop" />
      <ProductGrid
        products={items}
        loading={loading}
        refreshing={refreshing}
        loadingMore={loadingMore}
        error={error}
        onRefresh={refresh}
        onEndReached={loadMore}
        onRetry={refresh}
        isWishlisted={isSaved}
        onWishlistPress={(product) => toggle(product.id)}
        ListHeaderComponent={sortHeader}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  sortRow: {
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
});
