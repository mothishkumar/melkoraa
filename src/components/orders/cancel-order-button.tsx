"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { cancelOrderRequest } from "@/lib/api/checkout";
import { userFacingApiMessage } from "@/lib/api/client";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        className="label-caps border border-white/20 px-6 py-3 text-[0.65rem]"
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            await cancelOrderRequest(orderId);
            router.refresh();
          } catch (caught) {
            setError(userFacingApiMessage(caught));
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Cancelling" : "Cancel order"}
      </button>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
