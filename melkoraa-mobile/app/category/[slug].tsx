import { useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";

import { ProductGrid } from "@/src/components/catalog/ProductGrid";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { SafeScreen } from "@/src/components/ui/SafeScreen";
import { AppText } from "@/src/components/ui/AppText";
import { useProductList } from "@/src/hooks/use-products";
import { useWishlistContext } from "@/src/providers/wishlist-provider";
import { spacing } from "@/src/theme";

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { items, loading, refreshing, loadingMore, error, refresh, loadMore } = useProductList({
    category: slug,
  });
  const { isSaved, toggle } = useWishlistContext();

  const header = (
    <View style={styles.header}>
      <AppText variant="label" muted>Category</AppText>
      <AppText variant="h1" style={styles.title}>{slug.replace(/-/g, " ")}</AppText>
    </View>
  );

  return (
    <SafeScreen padded={false} edges={["top"]}>
      <AppHeader back showSearch />
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
        ListHeaderComponent={header}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    textTransform: "capitalize",
  },
});
