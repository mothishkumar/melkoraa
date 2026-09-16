import { Platform } from "react-native";

export type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type OpenRazorpayInput = {
  keyId: string;
  razorpayOrderId: string;
  amountMinor: number;
  currency: string;
  name?: string;
  email?: string;
  contact?: string;
};

export async function openRazorpayCheckout(
  input: OpenRazorpayInput,
): Promise<RazorpaySuccess> {
  if (Platform.OS === "web") {
    throw new Error(
      "Razorpay native checkout is not available on web. Use an Android or iOS device.",
    );
  }

  try {
    const RazorpayCheckout = require("react-native-razorpay").default;
    const result = await RazorpayCheckout.open({
      key: input.keyId,
      amount: input.amountMinor,
      currency: input.currency,
      order_id: input.razorpayOrderId,
      name: input.name ?? "MELKORAA",
      prefill: {
        email: input.email,
        contact: input.contact,
      },
      theme: { color: "#0A0A0A" },
    });
    return result as RazorpaySuccess;
  } catch {
    throw new Error(
      "Razorpay native SDK is not linked in this build. Use a dev client with react-native-razorpay, or complete checkout on the web store.",
    );
  }
}
