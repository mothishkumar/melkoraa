import { CheckoutClient } from "@/features/checkout/checkout-client";
import { requireAuth } from "@/lib/auth/require-auth";
import { listCustomerAddresses } from "@/server/services/addresses/address-service";
import { getCart } from "@/server/services/cart/cart-service";

export const metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const { user } = await requireAuth("/checkout");
  const cart = await getCart(user.id);
  const addresses = await listCustomerAddresses(user.id);

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
