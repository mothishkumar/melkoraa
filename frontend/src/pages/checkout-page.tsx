import { useEffect, useState } from "react";

import { CheckoutClient } from "@/features/checkout/checkout-client";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/api/client";
import { getCartRequest } from "@/lib/api/cart";
import type { AddressDto } from "@/types/addresses";
import type { CartDto } from "@/types/cart";

export function CheckoutPage() {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartDto | null>(null);
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    void Promise.all([
      getCartRequest(),
      apiRequest<AddressDto[]>("/api/v1/addresses"),
    ])
      .then(([cartData, addressData]) => {
        setCart(cartData);
        setAddresses(addressData);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (!user || loading || !cart) {
    return <div className="store-light min-h-[40vh] bg-[#f6f3ee]" />;
  }

  return (
    <div className="store-light bg-[#f6f3ee] text-[#111]">
      <div className="mx-auto max-w-[1600px] px-4 py-12 md:px-8 md:py-16">
        <p className="label-caps">Almost yours</p>
        <h1 className="editorial-display mt-4 text-4xl md:text-6xl">Checkout</h1>
        <div className="mt-12">
          <CheckoutClient userId={user.id} cart={cart} addresses={addresses} />
        </div>
      </div>
    </div>
  );
}
