"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAddressRequest } from "@/lib/api/addresses";
import { checkoutRequest, verifyPaymentRequest } from "@/lib/api/checkout";
import { ApiClientError, userFacingApiMessage } from "@/lib/api/client";
import {
  checkoutStorageKey,
  isVerifiedPaid,
} from "@/features/checkout/contract";
import { formatInr, formatInrFromMinor } from "@/lib/catalog/money";
import type { AddressDto } from "@/types/addresses";
import type { CartDto } from "@/types/cart";

type PayState =
  | "idle"
  | "preparing"
  | "opening"
  | "processing"
  | "verifying"
  | "success"
  | "failed"
  | "cancelled";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void;
    };
  }
}

async function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load payment."));
    document.body.appendChild(script);
  });
}

function readIdempotency(userId: string) {
  const key = checkoutStorageKey(userId);
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  sessionStorage.setItem(key, created);
  return created;
}

function clearIdempotency(userId: string) {
  sessionStorage.removeItem(checkoutStorageKey(userId));
}

export function CheckoutClient({
  userId,
  cart,
  addresses,
}: {
  userId: string;
  cart: CartDto;
  addresses: AddressDto[];
}) {
  const router = useRouter();
  const [addressId, setAddressId] = useState(addresses.find((row) => row.isDefault)?.id ?? addresses[0]?.id ?? "");
  const [state, setState] = useState<PayState>("idle");
  const [notice, setNotice] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "IN",
  });

  const estimate = useMemo(() => formatInr(cart.subtotal), [cart.subtotal]);

  if (cart.items.length === 0) {
    return (
      <p className="text-sm text-stone">
        Your bag is empty.{" "}
        <Link href="/products" className="underline underline-offset-4">
          Continue shopping
        </Link>
      </p>
    );
  }

  async function pay() {
    if (!addressId) {
      setNotice("Select or add a delivery address.");
      return;
    }
    setState("preparing");
    setNotice("Preparing payment");
    try {
      const idempotencyKey = readIdempotency(userId);
      const session = await checkoutRequest(addressId, idempotencyKey);
      if (!session.payment.razorpayOrderId || !session.payment.keyId) {
        setState("failed");
        setNotice("Payment could not be started.");
        clearIdempotency(userId);
        return;
      }
      if (isVerifiedPaid(session.order.paymentStatus) || isVerifiedPaid(session.payment.status)) {
        clearIdempotency(userId);
        setState("success");
        router.push(`/order/${session.order.id}`);
        return;
      }
      setState("opening");
      setNotice("Opening payment");
      await loadRazorpay();
      if (!window.Razorpay) {
        throw new Error("Payment is unavailable.");
      }
      const rzp = new window.Razorpay({
        key: session.payment.keyId,
        amount: session.payment.amountMinor,
        currency: session.payment.currency,
        order_id: session.payment.razorpayOrderId,
        name: "MELKORAA",
        description: session.order.orderNumber,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          setState("verifying");
          setNotice("Payment verification");
          try {
            const verified = await verifyPaymentRequest(response);
            if (isVerifiedPaid(verified.payment.status) || isVerifiedPaid(verified.order.paymentStatus)) {
              clearIdempotency(userId);
              setState("success");
              router.push(`/order/${verified.order.id}`);
              return;
            }
            setState("processing");
            setNotice("PAYMENT PROCESSING. We have not marked this order as paid yet.");
            router.push(`/order/${verified.order.id}`);
          } catch (error) {
            setState("failed");
            setNotice(userFacingApiMessage(error, "Payment verification failed."));
          }
        },
        modal: {
          ondismiss: () => {
            setState("cancelled");
            setNotice("Payment cancelled. Your order is not paid.");
          },
        },
      });
      rzp.on("payment.failed", () => {
        setState("failed");
        setNotice("Payment failed.");
      });
      setState("processing");
      setNotice("Payment processing");
      rzp.open();
    } catch (error) {
      if (error instanceof ApiClientError && error.code === "PAYMENT_UNAVAILABLE") {
        clearIdempotency(userId);
      }
      if (error instanceof ApiClientError && error.status === 401) {
        router.push("/login?next=%2Fcheckout");
        return;
      }
      setState("failed");
      setNotice(userFacingApiMessage(error));
    }
  }

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <div className="space-y-10 lg:col-span-7">
        <section>
          <h2 className="editorial-display text-2xl">Address</h2>
          <div className="mt-6 space-y-3">
            {addresses.map((address) => (
              <label
                key={address.id}
                className={`flex cursor-pointer gap-3 border bg-white p-4 ${
                  addressId === address.id ? "border-black" : "border-black/15"
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  className="mt-1"
                  checked={addressId === address.id}
                  onChange={() => setAddressId(address.id)}
                />
                <span className="text-sm leading-6">
                  {address.name}
                  <br />
                  {address.addressLine1}
                  {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                  <br />
                  {address.city}, {address.state} {address.postalCode}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h2 className="editorial-display text-2xl">New address</h2>
          <form
            className="mt-6 grid gap-4 sm:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              setCreating(true);
              setNotice(null);
              try {
                const created = await createAddressRequest({
                  ...form,
                  phone: form.phone || undefined,
                  addressLine2: form.addressLine2 || undefined,
                  isDefault: addresses.length === 0,
                });
                setAddressId(created.id);
                router.refresh();
              } catch (error) {
                setNotice(userFacingApiMessage(error));
              } finally {
                setCreating(false);
              }
            }}
          >
            {(
              [
                ["name", "Name"],
                ["phone", "Phone"],
                ["addressLine1", "Address"],
                ["addressLine2", "Address line 2"],
                ["city", "City"],
                ["state", "State"],
                ["postalCode", "Postal code"],
                ["country", "Country"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className={key.startsWith("address") ? "sm:col-span-2" : ""}>
                <Label htmlFor={key} className="label-caps text-[0.6rem]">
                  {label}
                </Label>
                <Input
                  id={key}
                  required={key !== "phone" && key !== "addressLine2"}
                  className="mt-2 h-12 rounded-none bg-transparent"
                  value={form[key]}
                  onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
                />
              </div>
            ))}
            <Button type="submit" disabled={creating} className="h-12 rounded-none sm:col-span-2">
              {creating ? "Saving" : "Save address"}
            </Button>
          </form>
        </section>
      </div>

      <aside className="h-fit border border-black/10 bg-white p-6 lg:col-span-5">
        <h2 className="editorial-display text-2xl">Order summary</h2>
        <ul className="mt-6 space-y-4">
          {cart.items.map((item) => (
            <li key={item.variantId} className="flex justify-between gap-4 text-sm">
              <span>
                {item.productName}
                <span className="mt-1 block text-stone">
                  {item.size} · {item.quantity}
                </span>
              </span>
              <span>{formatInrFromMinor(item.lineTotalMinor)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 flex justify-between border-t border-black/10 pt-4 text-sm">
          <span>Estimated subtotal</span>
          <span>{estimate}</span>
        </p>
        <p className="mt-3 text-xs leading-6 text-stone">
          You are not sending prices. MELKORAA calculates the payable amount on the server.
        </p>
        <Button
          type="button"
          className="mt-8 h-12 w-full rounded-none tracking-[0.24em] uppercase"
          disabled={state === "preparing" || state === "opening" || state === "verifying"}
          onClick={() => void pay()}
        >
          Pay
        </Button>
        {notice ? <p className="mt-4 text-sm text-stone">{notice}</p> : null}
      </aside>
    </div>
  );
}
