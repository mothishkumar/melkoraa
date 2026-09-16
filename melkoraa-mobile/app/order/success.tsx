import { useLocalSearchParams, router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppHeader } from "@/src/components/layout/AppHeader";
import { SafeScreen } from "@/src/components/ui/SafeScreen";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { paymentHeadline } from "@/src/checkout/contract";
import { useOrder } from "@/src/hooks/use-orders";
import { spacing } from "@/src/theme";

export default function OrderSuccessScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { order, loading } = useOrder(orderId);

  const headline = order
    ? paymentHeadline(order.paymentStatus, order.status)
    : "ORDER CONFIRMED";

  return (
    <SafeScreen edges={["top"]}>
      <AppHeader title="Order" showSearch={false} />
      <View style={styles.container}>
        <AppText variant="h1">{headline}</AppText>
        {loading ? (
          <AppText muted>Loading order details…</AppText>
        ) : order ? (
          <>
            <AppText variant="h3">{order.orderNumber}</AppText>
            <AppText muted>
              Payment verified by MELKORAA servers. Your order is confirmed only when payment status is paid.
            </AppText>
          </>
        ) : (
          <AppText muted>Your payment was submitted for verification.</AppText>
        )}
        {orderId ? (
          <Button
            label="View order"
            onPress={() => router.push(`/orders/${orderId}`)}
          />
        ) : null}
        <Button
          label="Continue shopping"
          variant="secondary"
          onPress={() => router.replace("/(tabs)/shop")}
        />
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.md,
    justifyContent: "center",
  },
});
