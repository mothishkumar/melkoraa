import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { CartEditor } from "@/components/cart/cart-editor";
import { useAuth } from "@/contexts/auth-context";
import { getCartRequest } from "@/lib/api/cart";
import type { CartDto } from "@/types/cart";

const emptyCart: CartDto = {
  id: null,
  itemCount: 0,
  subtotal: "0",
  subtotalMinor: 0,
  items: [],
};

export function CartPage() {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartDto | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    void getCartRequest().then(setCart).catch(() => setCart(emptyCart));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="store-light bg-[#f6f3ee] px-4 py-24 text-center text-[#111] md:px-8">
        <p className="editorial-display text-4xl">Your cart is empty.</p>
        <p className="mt-6 text-sm text-[#6f6b66]">Sign in to load your bag.</p>
        <Link to="/login?next=%2Fcart" className="mk-solid mt-8">Login</Link>
      </div>
    );
  }

  if (!cart) {
    return <div className="store-light min-h-[40vh] bg-[#f6f3ee]" />;
  }

  return (
    <div className="store-light bg-[#f6f3ee] text-[#111]">
      <div className="mx-auto max-w-[1600px] px-4 py-12 md:px-8 md:py-16">
        <p className="label-caps">Bag</p>
        <h1 className="editorial-display mt-4 text-4xl md:text-6xl">Your cart</h1>
        <div className="mt-12">
          <CartEditor cart={cart} />
        </div>
      </div>
    </div>
  );
}
