import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { ProductGrid } from "@/src/components/catalog/ProductGrid";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { SearchBar } from "@/src/components/layout/SearchBar";
import { SafeScreen } from "@/src/components/ui/SafeScreen";
import { AppText } from "@/src/components/ui/AppText";
import { useProductList } from "@/src/hooks/use-products";
import { useWishlistContext } from "@/src/providers/wishlist-provider";
import { spacing } from "@/src/theme";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const { items, loading, refreshing, loadingMore, error, refresh, loadMore } = useProductList({
    search: submitted || undefined,
    enabled: Boolean(submitted),
  });
  const { isSaved, toggle } = useWishlistContext();

  return (
    <SafeScreen padded={false} edges={["top"]}>
      <AppHeader back title="Search" showSearch={false} />
      <View style={styles.searchWrap}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onSubmit={() => setSubmitted(query.trim())}
          autoFocus
        />
      </View>
      {!submitted ? (
        <View style={styles.emptyPrompt}>
          <AppText variant="h3" muted>Search the collection</AppText>
          <AppText muted style={styles.hint}>Find pieces by name, style, or description.</AppText>
        </View>
      ) : (
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
        />
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  emptyPrompt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  hint: {
    textAlign: "center",
  },
});
