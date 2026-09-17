
import { useNavigate } from "react-router-dom";
import { useState } from "react";

import { removeWishlistRequest } from "@/lib/api/wishlist";
import { userFacingApiMessage } from "@/lib/api/client";

export function WishlistRemove({ productId }: { productId: string }) {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        className="label-caps text-[0.65rem]"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            await removeWishlistRequest(productId);
            navigate(0);
          } catch (caught) {
            setError(userFacingApiMessage(caught));
          } finally {
            setPending(false);
          }
        }}
      >
        Remove
      </button>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
