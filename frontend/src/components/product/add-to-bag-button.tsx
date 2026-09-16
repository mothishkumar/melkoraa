
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

import { SizeGuide } from "@/components/product/size-guide";
import { addCartItemRequest } from "@/lib/api/cart";
import { ApiClientError, userFacingApiMessage } from "@/lib/api/client";
import { showAddedToBagToast, useUiStore } from "@/hooks/use-ui-store";
import type { PublicVariant } from "@/types/catalog";

export function AddToBagButton({
  productName,
  productSlug,
  variants,
  available,
  isAuthenticated,
}: {
  productName: string;
  productSlug: string;
  variants: PublicVariant[];
  available: boolean;
  isAuthenticated: boolean;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [pending, setPending] = useState(false);
  const [picking, setPicking] = useState(false);
  const [size, setSize] = useState("");
  const [error, setError] = useState<string | null>(null);

  const liveVariants = useMemo(
    () => variants.filter((variant) => variant.available),
    [variants],
  );
  const sizes = useMemo(
    () => Array.from(new Set(liveVariants.map((variant) => variant.size))),
    [liveVariants],
  );

  async function add(variantId: string) {
    if (pending) return;
    if (!isAuthenticated) {
      const next = pathname || `/products/${productSlug}`;
      navigate(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const cart = await addCartItemRequest(variantId, 1);
      useUiStore.setState({ bagCount: cart.itemCount });
      showAddedToBagToast();
      setPicking(false);
    } catch (caught) {
      if (caught instanceof ApiClientError && caught.status === 401) {
        navigate(`/login?next=${encodeURIComponent(pathname || `/products/${productSlug}`)}`);
        return;
      }
      setError(userFacingApiMessage(caught));
    } finally {
      setPending(false);
    }
  }

  function onAddClick() {
    if (pending || !available) return;
    if (liveVariants.length === 0) {
      setError("That size is not available.");
      return;
    }
    if (liveVariants.length === 1 && sizes.length <= 1) {
      void add(liveVariants[0]!.id);
      return;
    }
    setPicking(true);
    setSize(sizes[0] ?? "");
  }

  const selected = liveVariants.find((variant) => variant.size === size) ?? liveVariants[0];

  return (
    <div className="mt-4 w-full">
      <button
        type="button"
        disabled={!available || pending}
        onClick={onAddClick}
        className="mk-solid w-full hover:opacity-85 disabled:opacity-40"
      >
        {pending ? "Adding" : available ? "Add to bag" : "Sold out"}
      </button>
      {picking ? (
        <div
          className="mt-3 border border-black/15 bg-[#f6f3ee] p-3 text-left"
          role="group"
          aria-label={`Choose a size for ${productName}`}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="label-caps text-[0.6rem]">Size</p>
            <SizeGuide sizes={sizes} productName={productName} />
          </div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSize(value)}
                className={`min-h-10 min-w-10 border px-3 text-sm ${
                  size === value ? "border-black bg-black text-white" : "border-black/20"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={pending || !selected}
            onClick={() => selected && void add(selected.id)}
            className="mk-solid mt-3 w-full disabled:opacity-40"
          >
            {pending ? "Adding" : "Confirm size"}
          </button>
        </div>
      ) : null}
      {error ? (
        <p className="mt-2 text-left text-sm text-[#6f6b66]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
