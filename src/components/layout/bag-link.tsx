"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getCartRequest } from "@/lib/api/cart";
import { formatInr } from "@/lib/catalog/money";
import { useUiStore } from "@/hooks/use-ui-store";
import type { CartDto } from "@/types/cart";

export function BagLink({ isAuthenticated }: { isAuthenticated: boolean }) {
  const bagCount = useUiStore((state) => state.bagCount);
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<CartDto | null>(null);

  useEffect(() => {
    if (!open || !isAuthenticated) return;
    getCartRequest()
      .then((data) => {
        setCart(data);
        useUiStore.setState({ bagCount: data.itemCount });
      })
      .catch(() => setCart(null));
  }, [open, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <Link href="/login?next=%2Fcart" className="label-caps text-[0.65rem] text-off-white/80 hover:text-off-white">
        BAG
      </Link>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="label-caps text-[0.65rem] text-off-white/80 hover:text-off-white"
        aria-label={bagCount > 0 ? `Open bag, ${bagCount} items` : "Open bag"}
      >
        BAG{bagCount > 0 ? ` (${bagCount})` : ""}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[min(100%,380px)] rounded-none border-black/10 bg-[#f6f3ee] p-0 text-[#111]"
      >
        <SheetHeader className="border-b border-black/10 px-6 py-5">
          <SheetTitle className="editorial-display text-left text-sm tracking-[0.3em] text-[#111]">
            Your cart{bagCount > 0 ? ` (${bagCount})` : ""}
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-6 py-6">
          {(cart?.items ?? []).slice(0, 4).map((item) => (
            <div key={item.variantId} className="flex justify-between gap-3 text-sm">
              <div>
                <p className="uppercase tracking-[0.08em]">{item.productName}</p>
                <p className="mt-1 text-[#6f6b66]">
                  {item.size} · {item.quantity}
                </p>
              </div>
              <p>{formatInr(item.lineTotal)}</p>
            </div>
          ))}
          {cart && cart.items.length === 0 ? (
            <p className="text-sm text-[#6f6b66]">Your bag is empty.</p>
          ) : null}
          <Link
            href="/cart"
            onClick={() => setOpen(false)}
            className="mk-outline mt-4 border-black text-[#111]"
          >
            View bag
          </Link>
          <Link
            href="/checkout"
            onClick={() => setOpen(false)}
            className="mk-solid hover:opacity-90"
          >
            Proceed to checkout
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
