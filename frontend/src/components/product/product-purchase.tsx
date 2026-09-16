
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { SizeGuide } from "@/components/product/size-guide";
import { addCartItemRequest } from "@/lib/api/cart";
import { ApiClientError, userFacingApiMessage } from "@/lib/api/client";
import { formatInr } from "@/lib/catalog/money";
import { showAddedToBagToast, useUiStore } from "@/hooks/use-ui-store";
import type { ProductDetail } from "@/types/catalog";
import { WishlistButton } from "@/components/product/wishlist-button";

export function ProductPurchase({
  product,
  wishlisted,
  isAuthenticated,
}: {
  product: ProductDetail;
  wishlisted: boolean;
  isAuthenticated: boolean;
}) {
  const navigate = useNavigate();
  const sizes = useMemo(
    () => Array.from(new Set(product.variants.map((variant) => variant.size))),
    [product.variants],
  );
  const colors = useMemo(
    () => Array.from(new Set(product.variants.map((variant) => variant.color))),
    [product.variants],
  );
  const [size, setSize] = useState(sizes[0] ?? "");
  const [color, setColor] = useState(colors[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const selected = product.variants.find(
    (variant) => variant.size === size && variant.color === color,
  );
  const price = selected?.price ?? product.basePrice;
  const canAdd = Boolean(selected?.available);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="label-caps text-[#8a8580]">{product.drop?.name ?? "MELKORAA"}</p>
        <h1 className="editorial-display mt-3 text-4xl tracking-[0.12em] text-[#111] md:text-5xl">{product.name}</h1>
        <p className="mt-5 text-lg text-[#111]">{formatInr(price)}</p>
        {product.compareAtPrice ? (
          <p className="mt-1 text-sm text-[#6f6b66] line-through">{formatInr(product.compareAtPrice)}</p>
        ) : null}
        <p className="mt-3 label-caps">
          {selected ? (selected.available ? "Available" : "Unavailable") : "Select a variant"}
        </p>
      </div>

      {product.description || product.shortDescription ? (
        <p className="max-w-md text-sm leading-7 text-[#6f6b66]">
          {product.description ?? product.shortDescription}
        </p>
      ) : null}

      {sizes.length > 0 ? (
        <fieldset>
          <legend className="sr-only">Size</legend>
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="label-caps">Size</span>
            <SizeGuide sizes={sizes} productName={product.name} />
          </div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSize(value)}
                className={`min-h-11 min-w-11 border px-3 text-sm ${
                  size === value ? "border-black bg-black text-white" : "border-black/20"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      {colors.length > 1 ? (
        <fieldset>
          <legend className="label-caps mb-3">Color</legend>
          <div className="flex flex-wrap gap-2">
            {colors.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setColor(value)}
                className={`min-h-11 border px-4 text-sm ${
                  color === value ? "border-black bg-black text-white" : "border-black/20"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div>
        <label className="label-caps" htmlFor="qty">
          Quantity
        </label>
        <div className="mt-3 flex items-center border border-black/20">
          <button
            type="button"
            className="size-11"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
          >
            −
          </button>
          <input
            id="qty"
            readOnly
            value={quantity}
            className="w-12 bg-transparent text-center text-sm"
          />
          <button
            type="button"
            className="size-11"
            aria-label="Increase quantity"
            onClick={() => setQuantity((value) => Math.min(20, value + 1))}
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          disabled={!canAdd || pending}
          className="h-12 flex-1 rounded-none tracking-[0.22em] uppercase"
          onClick={async () => {
            if (pending) return;
            if (!isAuthenticated) {
              navigate(`/login?next=${encodeURIComponent(`/products/${product.slug}`)}`);
              return;
            }
            if (!selected?.available) {
              setNotice("That size is not available.");
              return;
            }
            setPending(true);
            setNotice(null);
            try {
              const cart = await addCartItemRequest(selected.id, quantity);
              useUiStore.setState({ bagCount: cart.itemCount });
              showAddedToBagToast();
              setNotice(null);
            } catch (error) {
              if (error instanceof ApiClientError && error.status === 401) {
                navigate(`/login?next=${encodeURIComponent(`/products/${product.slug}`)}`);
                return;
              }
              setNotice(userFacingApiMessage(error));
            } finally {
              setPending(false);
            }
          }}
        >
          {pending ? "Adding" : canAdd ? "Add to bag" : "Unavailable"}
        </Button>
        <WishlistButton productId={product.id} initial={wishlisted} />
      </div>
      {notice ? <p className="text-sm text-[#6f6b66]">{notice}</p> : null}

      <ul className="grid gap-3 border-t border-black/10 pt-6 text-[0.68rem] uppercase tracking-[0.14em] text-[#6f6b66] sm:grid-cols-3">
        <li>Free shipping on qualifying orders</li>
        <li>Easy returns</li>
        <li>Secure payments</li>
      </ul>

      <details className="border-t border-black/10 pt-4">
        <summary className="label-caps cursor-pointer list-none">Product details</summary>
        <p className="mt-3 text-sm leading-7 text-[#6f6b66]">
          {product.shortDescription ?? product.description ?? product.brand}
        </p>
      </details>
      {product.description && product.shortDescription ? (
        <details className="border-t border-black/10 pt-4">
          <summary className="label-caps cursor-pointer list-none">Material & care</summary>
          <p className="mt-3 text-sm leading-7 text-[#6f6b66]">{product.description}</p>
        </details>
      ) : null}
    </div>
  );
}
