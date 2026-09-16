import { CartEditor } from "@/components/cart/cart-editor";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getCart } from "@/server/services/cart/cart-service";
import { emptyCart } from "@/server/services/cart/mappers";
import Link from "next/link";

export const metadata = {
  title: "Bag",
};

export default async function CartPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="store-light bg-[#f6f3ee] px-4 py-24 text-center text-[#111] md:px-8">
        <p className="editorial-display text-4xl">Your cart is empty.</p>
        <p className="mt-6 text-sm text-[#6f6b66]">Sign in to load your bag.</p>
        <Link href="/login?next=%2Fcart" className="mk-solid mt-8">
          Login
        </Link>
      </div>
    );
  }
  const cart = (await getCart(user.id)) ?? emptyCart();
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
