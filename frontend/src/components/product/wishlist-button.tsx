
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
          "inline-flex size-10 items-center justify-center bg-white/90 text-black shadow-sm transition-colors hover:bg-white disabled:opacity-50",
        )}
        onClick={async (event) => {
          event.preventDefault();
          event.stopPropagation();
          setPending(true);
          setError(null);
          try {
            const wishlist = await toggleWishlistRequest(productId);
            setOn(wishlist.items.some((item) => item.productId === productId));
          } catch (caught) {
            if (caught instanceof ApiClientError && caught.status === 401) {
              navigate(`/login?next=${encodeURIComponent(`/products`)}`);
              return;
            }
            setError(userFacingApiMessage(caught));
          } finally {
            setPending(false);
          }
        }}
      >
        <Heart className={cn("size-4", on ? "fill-black" : "")} />
      </button>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
