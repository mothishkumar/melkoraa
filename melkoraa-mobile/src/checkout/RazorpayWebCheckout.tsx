import { Modal, StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { AppText } from "@/src/components/ui/AppText";
import { colors, spacing } from "@/src/theme";
import type { RazorpaySuccess } from "@/src/checkout/razorpay";

type RazorpayWebCheckoutProps = {
  visible: boolean;
  keyId: string;
  razorpayOrderId: string;
  amountMinor: number;
  currency: string;
  email?: string;
  onSuccess: (result: RazorpaySuccess) => void;
  onDismiss: () => void;
  onError: (message: string) => void;
};

function buildCheckoutHtml(input: {
  keyId: string;
  razorpayOrderId: string;
  amountMinor: number;
  currency: string;
  email?: string;
}) {
  return `<!DOCTYPE html>
<html>
  <head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
  <body>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <script>
      const options = {
        key: ${JSON.stringify(input.keyId)},
        amount: ${input.amountMinor},
        currency: ${JSON.stringify(input.currency)},
        order_id: ${JSON.stringify(input.razorpayOrderId)},
        name: "MELKORAA",
        prefill: { email: ${JSON.stringify(input.email ?? "")} },
        theme: { color: "#0A0A0A" },
        handler: function (response) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "success",
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          }));
        },
        modal: {
          ondismiss: function () {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: "dismiss" }));
          }
        }
      };
      const rzp = new Razorpay(options);
      rzp.on("payment.failed", function (response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "error",
          message: response.error && response.error.description ? response.error.description : "Payment failed."
        }));
      });
      rzp.open();
    </script>
  </body>
</html>`;
}

export function RazorpayWebCheckout({
  visible,
  keyId,
  razorpayOrderId,
  amountMinor,
  currency,
  email,
  onSuccess,
  onDismiss,
  onError,
}: RazorpayWebCheckoutProps) {
  function handleMessage(event: WebViewMessageEvent) {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as {
        type: string;
        message?: string;
        razorpay_payment_id?: string;
        razorpay_order_id?: string;
        razorpay_signature?: string;
      };
      if (payload.type === "success") {
        onSuccess({
          razorpay_payment_id: payload.razorpay_payment_id ?? "",
          razorpay_order_id: payload.razorpay_order_id ?? "",
          razorpay_signature: payload.razorpay_signature ?? "",
        });
        return;
      }
      if (payload.type === "dismiss") {
        onDismiss();
        return;
      }
      onError(payload.message ?? "Payment could not be completed.");
    } catch {
      onError("Payment response was invalid.");
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.container}>
        <AppText variant="label" style={styles.label}>Secure payment</AppText>
        <WebView
          originWhitelist={["*"]}
          source={{
            html: buildCheckoutHtml({
              keyId,
              razorpayOrderId,
              amountMinor,
              currency,
              email,
            }),
          }}
          onMessage={handleMessage}
          onError={() => onError("Could not load Razorpay checkout.")}
          style={styles.webview}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xl,
  },
  label: {
    textAlign: "center",
    marginBottom: spacing.md,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
