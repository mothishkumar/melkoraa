
import { Link } from "react-router-dom";
import { useEffect } from "react";

import { clearBagToast, useUiStore } from "@/hooks/use-ui-store";

export function BagToast() {
  const toast = useUiStore((state) => state.bagToast);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => clearBagToast(), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-md items-center justify-between gap-4 border border-black/10 bg-[#111] px-4 py-3 text-[#f6f3ee] shadow-lg md:left-auto md:right-6"
    >
      <p className="text-sm tracking-[0.12em] uppercase">{toast.message}</p>
      <Link
        to={toast.href}
        onClick={() => clearBagToast()}
        className="label-caps shrink-0 text-[0.62rem] underline underline-offset-4"
      >
        {toast.label}
      </Link>
    </div>
  );
}
