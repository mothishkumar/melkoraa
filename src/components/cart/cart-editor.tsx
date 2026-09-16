"use client";

import Link from "next/link";
import { useState } from "react";

import {
  clearCartRequest,
  removeCartItemRequest,
  updateCartItemRequest,
} from "@/lib/api/cart";
import { userFacingApiMessage } from "@/lib/api/client";
import { formatInr, formatInrFromMinor } from "@/lib/catalog/money";
import { useUiStore } from "@/hooks/use-ui-store";
import type { CartDto } from "@/types/cart";

export function CartEditor({ cart }: { cart: CartDto }) {
  const [bag, setBag] = useState(cart);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function run(label: string, fn: () => Promise<CartDto>) {
    setPending(label);
    setNotice(null);
    try {
      const next = await fn();
      setBag(next);
      useUiStore.setState({ bagCount: next.itemCount });
    } catch (error) {
      setNotice(userFacingApiMessage(error));
    } finally {
      setPending(null);
    }
  }

  if (bag.items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="editorial-display text-4xl">YOUR CART IS EMPTY.</p>
        <Link href="/products" className="mk-outline mt-8 border-black">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <ul className="space-y-8 lg:col-span-8">
        {bag.items.map((item) => (
          <li key={item.variantId} className="flex flex-col gap-4 border-b border-black/10 pb-8 sm:flex-row sm:justify-between">
            <div>
              <Link href={`/products/${item.productSlug}`} className="text-sm uppercase tracking-[0.08em]">
                {item.productName}
              </Link>
              <p className="mt-2 text-sm text-stone">
                {item.size} / {item.color}
              </p>
              <p className="mt-1 text-sm">{formatInrFromMinor(item.unitPriceMinor)}</p>
              <p className="mt-1 label-caps text-[0.6rem]">
                {item.available ? "Available" : "No longer available"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-black/15">
                <button
                  type="button"
                  className="size-11"
                  aria-label={`Decrease ${item.productName}`}
                  disabled={pending !== null}
                  onClick={() =>
                    item.quantity <= 1
                      ? run(item.variantId, () => removeCartItemRequest(item.variantId))
                      : run(item.variantId, () =>
                          updateCartItemRequest(item.variantId, item.quantity - 1),
                        )
                  }
                >
                  −
                </button>
                <span className="w-10 text-center text-sm">{item.quantity}</span>
                <button
                  type="button"
                  className="size-11"
                  aria-label={`Increase ${item.productName}`}
                  disabled={pending !== null}
                  onClick={() =>
                    run(item.variantId, () =>
                      updateCartItemRequest(item.variantId, item.quantity + 1),
                    )
                  }
                >
                  +
                </button>
              </div>
              <p className="w-24 text-right text-sm">{formatInrFromMinor(item.lineTotalMinor)}</p>
              <button
                type="button"
                className="label-caps text-[0.6rem]"
                disabled={pending !== null}
                onClick={() => run(item.variantId, () => removeCartItemRequest(item.variantId))}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <aside className="lg:col-span-4">
        <p className="label-caps">Summary</p>
        <p className="mt-4 flex justify-between text-sm">
          <span>Estimated subtotal</span>
          <span>{formatInr(bag.subtotal)}</span>
        </p>
        <p className="mt-3 text-xs leading-6 text-stone">
          Final total is calculated on the server at checkout. Shipping and tax are not applied in this phase.
        </p>
        {notice ? <p className="mt-4 text-sm text-destructive">{notice}</p> : null}
        <Link
          href="/checkout"
          className="mt-8 flex h-12 items-center justify-center bg-[#111] text-[0.7rem] tracking-[0.28em] text-[#f6f3ee] uppercase hover:opacity-85"
        >
          Checkout
        </Link>
        <button
          type="button"
          className="mt-4 label-caps text-[0.65rem]"
          disabled={pending !== null}
          onClick={() => run("clear", clearCartRequest)}
        >
          Clear bag
        </button>
      </aside>
    </div>
  );
}
