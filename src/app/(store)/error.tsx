"use client";

import { useEffect } from "react";

import { logger } from "@/lib/logger";

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("store.page_error", { digest: error.digest });
  }, [error]);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-24 md:px-8">
      <p className="label-caps">Error</p>
      <h1 className="editorial-display mt-4 text-4xl">Something went wrong</h1>
      <p className="mt-4 max-w-md text-sm text-stone">
        The page could not be rendered. Try again, or return home.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 border border-off-white px-6 py-3 text-[0.65rem] tracking-[0.22em] uppercase"
      >
        Try again
      </button>
    </div>
  );
}
