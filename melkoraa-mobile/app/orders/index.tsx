import { router } from "expo-router";
import { Pressable, RefreshControl, ScrollView, StyleSheet } from "react-native";

import { AuthGate } from "@/src/components/auth/AuthGate";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { SafeScreen } from "@/src/components/ui/SafeScreen";
import { AppText } from "@/src/components/ui/AppText";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { useOrders } from "@/src/hooks/use-orders";
import { colors, radii, spacing } from "@/src/theme";
import { formatPrice } from "@/src/utils/format";

function OrdersContent() {
  const { orders, loading, error, refresh } = useOrders();

  if (loading) {
    return <AppText muted style={styles.pad}>Loading orders…</AppText>;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  if (orders.length === 0) {
    return <EmptyState title="No orders yet" message="Your purchases will appear here." />;
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.text} />
      }
      contentContainerStyle={styles.content}>
      {orders.map((order) => (
        <Pressable
          key={order.id}
          style={styles.card}
          onPress={() => router.push(`/orders/${order.id}`)}>
          <AppText variant="h3">{order.orderNumber}</AppText>
          <AppText muted>{new Date(order.createdAt).toLocaleDateString()}</AppText>
          <AppText>{formatPrice(order.totalAmount)}</AppText>
          <AppText variant="caption" muted>
            {order.status} · {order.paymentStatus}
          </AppText>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export default function OrdersScreen() {
  return (
    <AuthGate
      title="Orders"
      message="Sign in to view your order history."
      headerTitle="Orders">
      <SafeScreen padded={false} edges={["top"]}>
        <AppHeader back title="Orders" showSearch={false} />
        <OrdersContent />
      </SafeScreen>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg },
  content: { padding: spacing.lg, gap: spacing.md },
  card: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.xs,
  },
});
