import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { AuthGate } from "@/src/components/auth/AuthGate";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { SafeScreen } from "@/src/components/ui/SafeScreen";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { useOrder } from "@/src/hooks/use-orders";
import { orderService } from "@/src/services/order.service";
import { colors, radii, spacing } from "@/src/theme";
import { formatPrice } from "@/src/utils/format";

function OrderDetailContent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { order, loading, error, refresh } = useOrder(id);

  if (loading) {
    return <AppText muted style={styles.pad}>Loading order…</AppText>;
  }

  if (error || !order) {
    return <ErrorState message={error ?? "Order not found."} onRetry={refresh} />;
  }

  async function handleCancel() {
    if (!order) return;
    const result = await orderService.cancel(order.id);
    if (result.status === "success") {
      refresh();
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <AppText variant="h1">{order.orderNumber}</AppText>
      <AppText muted>
        {order.status} · {order.paymentStatus} · {order.fulfillmentStatus}
      </AppText>
      <AppText variant="h2">{formatPrice(order.totalAmount)}</AppText>

      <AppText variant="label" style={styles.section}>Items</AppText>
      {order.items.map((item) => (
        <View key={item.id} style={styles.row}>
          <AppText variant="h3">{item.productName}</AppText>
          <AppText muted>
            {item.color} · {item.size} · Qty {item.quantity}
          </AppText>
          <AppText>{formatPrice(item.lineTotal)}</AppText>
        </View>
      ))}

      <AppText variant="label" style={styles.section}>Shipping</AppText>
      <AppText muted>
        {order.shippingAddress.name}
        {"\n"}
        {order.shippingAddress.addressLine1}
        {"\n"}
        {order.shippingAddress.city}, {order.shippingAddress.state}
      </AppText>

      {order.status === "pending" && order.paymentStatus === "pending" ? (
        <Button label="Cancel order" variant="secondary" onPress={handleCancel} />
      ) : null}
    </ScrollView>
  );
}

export default function OrderDetailScreen() {
  return (
    <AuthGate title="Order" message="Sign in to view this order." headerTitle="Order">
      <SafeScreen padded={false} edges={["top"]}>
        <AppHeader back title="Order" showSearch={false} />
        <OrderDetailContent />
      </SafeScreen>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg },
  content: { padding: spacing.lg, gap: spacing.md },
  section: { marginTop: spacing.lg },
  row: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.xs,
  },
});
