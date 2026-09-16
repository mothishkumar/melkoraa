import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import { AppHeader } from "@/src/components/layout/AppHeader";
import { SafeScreen } from "@/src/components/ui/SafeScreen";
import { LoginRequired } from "@/src/components/ui/LoginRequired";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { useCart } from "@/src/hooks/use-cart";
import { colors, radii, spacing } from "@/src/theme";
import { formatPrice } from "@/src/utils/format";

export default function CartScreen() {
  const { cart, loading, refreshing, authRequired, error, refresh, removeItem, mutating } = useCart();

  if (authRequired) {
    return (
      <SafeScreen edges={["top"]}>
        <AppHeader title="Cart" showSearch={false} />
        <LoginRequired
          title="Sign in to view your bag"
          message="Your cart is tied to your MELKORAA account. Sign in to see items you've added."
          apiNote="Cart API may return 401 until the backend accepts Bearer tokens from mobile."
        />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen padded={false} edges={["top"]}>
      <AppHeader title="Cart" showSearch={false} />
      {loading && !cart ? (
        <View style={styles.centered}>
          <AppText muted>Loading your bag…</AppText>
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : !cart || cart.itemCount === 0 ? (
        <EmptyState title="Your bag is empty" message="Explore the collection and add pieces you love." />
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.text} />
          }
          contentContainerStyle={styles.content}>
          {cart.items.map((item) => (
            <View key={item.variantId} style={styles.item}>
              <View style={styles.itemMeta}>
                <AppText variant="h3">{item.productName}</AppText>
                <AppText variant="caption" muted>
                  {item.color} · {item.size} · Qty {item.quantity}
                </AppText>
                <AppText variant="h3">{formatPrice(item.lineTotal)}</AppText>
                {!item.available ? (
                  <AppText variant="caption" color={colors.sale}>Limited availability</AppText>
                ) : null}
              </View>
              <Button
                label="Remove"
                variant="ghost"
                disabled={mutating}
                onPress={() => removeItem(item.variantId)}
              />
            </View>
          ))}
          <View style={styles.summary}>
            <AppText variant="label">Subtotal</AppText>
            <AppText variant="h2">{formatPrice(cart.subtotal)}</AppText>
            <AppText variant="caption" muted>
              Checkout ships in a later phase. Cart service is ready for when Bearer auth lands.
            </AppText>
          </View>
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
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  itemMeta: {
    flex: 1,
    gap: spacing.xs,
  },
  summary: {
    marginTop: spacing.xl,
    gap: spacing.sm,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
