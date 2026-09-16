import { router } from "expo-router";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import { HeroBanner } from "@/src/components/catalog/HeroBanner";
import { HorizontalProductRow } from "@/src/components/catalog/HorizontalProductRow";
import { CategoryRow } from "@/src/components/catalog/CategoryRow";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { SafeScreen } from "@/src/components/ui/SafeScreen";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { ProductCardSkeleton } from "@/src/components/ui/Skeleton";
import { useHomeFeed } from "@/src/hooks/use-home";
import { colors, spacing } from "@/src/theme";

export default function HomeScreen() {
  const { data, loading, refreshing, error, refresh } = useHomeFeed();
  const heroCollection = data?.collections[0] ?? null;

  return (
    <SafeScreen padded={false} edges={["top"]}>
      <AppHeader showWishlist onWishlistPress={() => router.push("/wishlist")} />
      {error && !data ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.text} />
          }
          contentContainerStyle={styles.content}>
          <View style={styles.heroWrap}>
            <HeroBanner
              collection={heroCollection}
              onPress={() => {
                if (heroCollection) router.push(`/category/${heroCollection.slug}`);
              }}
            />
          </View>

          {loading && !data ? (
            <View style={styles.skeletonRow}>
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </View>
          ) : null}

          {data ? (
            <>
              <CategoryRow
                categories={data.categories}
                onSelect={(slug) => {
                  if (slug) router.push(`/category/${slug}`);
                  else router.push("/(tabs)/shop");
                }}
              />
              <HorizontalProductRow
                title="New Arrivals"
                products={data.newArrivals}
                onSeeAll={() => router.push("/(tabs)/shop")}
              />
              <HorizontalProductRow
                title="Featured"
                products={data.featured}
                onSeeAll={() => router.push("/(tabs)/shop")}
              />
            </>
          ) : null}
        </ScrollView>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
  },
  heroWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  skeletonRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
