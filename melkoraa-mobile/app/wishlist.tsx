import { router } from "expo-router";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import { AppHeader } from "@/src/components/layout/AppHeader";
import { SafeScreen } from "@/src/components/ui/SafeScreen";
import { LoginRequired } from "@/src/components/ui/LoginRequired";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { AppText } from "@/src/components/ui/AppText";
import { useWishlistContext } from "@/src/providers/wishlist-provider";
import { colors, radii, spacing } from "@/src/theme";
import { formatPrice } from "@/src/utils/format";

export default function WishlistScreen() {
  const { wishlist, loading, authRequired, refresh, toggle } = useWishlistContext();

  if (authRequired) {
    return (
      <SafeScreen edges={["top"]}>
        <AppHeader back title="Wishlist" showSearch={false} />
        <LoginRequired
          title="Save what you love"
          message="Sign in to view and manage your wishlist. Browsing is open to everyone."
          apiNote="Wishlist mutations return 401 until Bearer auth is enabled on the API."
        />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen padded={false} edges={["top"]}>
      <AppHeader back title="Wishlist" showSearch={false} />
      {loading && !wishlist ? (
        <View style={styles.centered}>
          <AppText muted>Loading wishlist…</AppText>
        </View>
      ) : !wishlist || wishlist.itemCount === 0 ? (
        <EmptyState title="No saved pieces yet" message="Tap the heart on any product to save it here." />
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.text} />
          }
          contentContainerStyle={styles.content}>
          {wishlist.items.map((item) => (
            <Pressable
              key={item.productId}
              style={styles.row}
              onPress={() => router.push(`/product/${item.slug}`)}>
              <View style={styles.meta}>
                <AppText variant="h3">{item.name}</AppText>
                <AppText variant="caption" muted>{formatPrice(item.price)}</AppText>
                {!item.available ? (
                  <AppText variant="caption" color={colors.sale}>Currently unavailable</AppText>
                ) : null}
              </View>
              <Pressable onPress={() => toggle(item.productId)} hitSlop={8}>
                <AppText variant="caption" muted>Remove</AppText>
              </Pressable>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  meta: {
    flex: 1,
    gap: spacing.xs,
  },
});
