import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { AuthGate } from "@/src/components/auth/AuthGate";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { SafeScreen } from "@/src/components/ui/SafeScreen";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { RazorpayWebCheckout } from "@/src/checkout/RazorpayWebCheckout";
import { buildVerifyBody, isVerifiedPaid } from "@/src/checkout/contract";
import { clearIdempotencyKey, readIdempotencyKey } from "@/src/checkout/idempotency";
import { useAddresses } from "@/src/hooks/use-addresses";
import { useCart } from "@/src/hooks/use-cart";
import { useAuth } from "@/src/auth/auth-context";
import { checkoutService } from "@/src/services/checkout.service";
import { colors, radii, spacing } from "@/src/theme";
import { formatPrice } from "@/src/utils/format";
import { userFacingApiMessage } from "@/src/api/errors";
import type { CheckoutSessionDto } from "@/src/api/types/payments";

function CheckoutContent() {
  const { user, profile, session } = useAuth();
  const { cart, loading: cartLoading, error: cartError, refresh } = useCart();
  const { addresses, loading: addressLoading } = useAddresses();
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSessionDto | null>(null);
  const [showRazorpay, setShowRazorpay] = useState(false);

  const activeAddressId =
    selectedAddressId || addresses.find((row) => row.isDefault)?.id || addresses[0]?.id || "";

  if (cartLoading || addressLoading) {
    return <AppText muted style={styles.pad}>Preparing checkout…</AppText>;
  }

  if (cartError) {
    return <ErrorState message={cartError} onRetry={refresh} />;
  }

  if (!cart || cart.itemCount === 0) {
    return <AppText muted style={styles.pad}>Your bag is empty.</AppText>;
  }

  async function startCheckout() {
    if (!activeAddressId || !user) {
      setNotice("Select a delivery address.");
      return;
    }
    setPaying(true);
    setNotice("Preparing payment…");
    try {
      const idempotencyKey = await readIdempotencyKey(user.id);
      const result = await checkoutService.createSession({
        addressId: activeAddressId,
        idempotencyKey,
      });
      if (result.status === "auth_required") {
        setNotice("Sign in to continue checkout.");
        router.push("/(auth)/login");
        return;
      }
      if (result.status === "error") {
        setNotice(userFacingApiMessage(new Error(result.message)));
        return;
      }
      const sessionData = result.data;
      if (!sessionData.payment.razorpayOrderId || !sessionData.payment.keyId) {
        await clearIdempotencyKey(user.id);
        setNotice("Payment could not be started.");
        return;
      }
      if (
        isVerifiedPaid(sessionData.order.paymentStatus) ||
        isVerifiedPaid(sessionData.payment.status)
      ) {
        await clearIdempotencyKey(user.id);
        router.replace({
          pathname: "/order/success",
          params: { orderId: sessionData.order.id },
        });
        return;
      }
      setCheckoutSession(sessionData);
      setShowRazorpay(true);
    } catch (error) {
      setNotice(userFacingApiMessage(error));
    } finally {
      setPaying(false);
    }
  }

  async function handlePaymentSuccess(input: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) {
    if (!user) return;
    setShowRazorpay(false);
    setPaying(true);
    setNotice("Verifying payment…");
    try {
      const verify = await checkoutService.verifyPayment(
        buildVerifyBody(input),
      );
      if (verify.status !== "success") {
        setNotice(
          verify.status === "error"
            ? userFacingApiMessage(new Error(verify.message))
            : "Sign in to verify payment.",
        );
        return;
      }
      if (!isVerifiedPaid(verify.data.payment.status)) {
        setNotice("Payment is still processing. Check your orders shortly.");
        return;
      }
      await clearIdempotencyKey(user.id);
      router.replace({
        pathname: "/order/success",
        params: { orderId: verify.data.order.id },
      });
    } catch (error) {
      setNotice(userFacingApiMessage(error));
    } finally {
      setPaying(false);
    }
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="h2">Order summary</AppText>
        {cart.items.map((item) => (
          <View key={item.variantId} style={styles.row}>
            <AppText>{item.productName}</AppText>
            <AppText muted>{item.quantity} × {formatPrice(item.unitPrice)}</AppText>
          </View>
        ))}
        <AppText variant="h3">Subtotal {formatPrice(cart.subtotal)}</AppText>
        <AppText variant="label" style={styles.section}>Delivery address</AppText>
        {addresses.length === 0 ? (
          <Button
            label="Add address"
            variant="secondary"
            onPress={() => router.push("/account/addresses")}
          />
        ) : (
          addresses.map((address) => (
            <Pressable
              key={address.id}
              style={[
                styles.addressCard,
                activeAddressId === address.id && styles.addressSelected,
              ]}
              onPress={() => setSelectedAddressId(address.id)}>
              <AppText variant="h3">{address.name}</AppText>
              <AppText muted>{address.addressLine1}, {address.city}</AppText>
            </Pressable>
          ))
        )}
        {notice ? <AppText color={colors.sale}>{notice}</AppText> : null}
        <Button label="Pay now" onPress={startCheckout} loading={paying} />
        <AppText variant="caption" muted>
          Totals and tax are calculated by the server at checkout. Payment succeeds only after server verification.
        </AppText>
      </ScrollView>

      {checkoutSession?.payment.keyId && checkoutSession.payment.razorpayOrderId ? (
        <RazorpayWebCheckout
          visible={showRazorpay}
          keyId={checkoutSession.payment.keyId}
          razorpayOrderId={checkoutSession.payment.razorpayOrderId}
          amountMinor={checkoutSession.payment.amountMinor}
          currency={checkoutSession.payment.currency}
          email={profile?.email ?? session?.user.email ?? undefined}
          onSuccess={handlePaymentSuccess}
          onDismiss={() => {
            setShowRazorpay(false);
            setNotice("Payment cancelled.");
          }}
          onError={(message) => {
            setShowRazorpay(false);
            setNotice(message);
          }}
        />
      ) : null}
    </>
  );
}

export default function CheckoutScreen() {
  return (
    <AuthGate
      title="Checkout"
      message="Sign in to complete your purchase."
      headerTitle="Checkout">
      <SafeScreen padded={false} edges={["top"]}>
        <AppHeader back title="Checkout" showSearch={false} />
        <CheckoutContent />
      </SafeScreen>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg },
  content: { padding: spacing.lg, gap: spacing.md },
  row: { gap: spacing.xs },
  section: { marginTop: spacing.lg },
  addressCard: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  addressSelected: {
    borderColor: colors.borderStrong,
  },
});
