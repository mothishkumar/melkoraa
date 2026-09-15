"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { toggleWishlistRequest } from "@/lib/api/wishlist";
import { ApiClientError, userFacingApiMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  initial = false,
  className,
}: {
  productId: string;
  initial?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={className}>
      <button
        type="button"
        disabled={pending}
        aria-pressed={on}
        aria-label={on ? "Remove from wishlist" : "Save to wishlist"}
        className={cn(
          "inline-flex size-10 items-center justify-center border border-white/20 text-off-white transition-colors hover:border-off-white disabled:opacity-50",
        )}
        onClick={async (event) => {
          event.preventDefault();
          event.stopPropagation();
          setPending(true);
          setError(null);
          try {
            const wishlist = await toggleWishlistRequest(productId);
            setOn(wishlist.items.some((item) => item.productId === productId));
            router.refresh();
          } catch (caught) {
            if (caught instanceof ApiClientError && caught.status === 401) {
              router.push(`/login?next=${encodeURIComponent(`/products`)}`);
              return;
            }
            setError(userFacingApiMessage(caught));
          } finally {
            setPending(false);
          }
        }}
      >
        <Heart className={cn("size-4", on ? "fill-off-white" : "")} />
      </button>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
