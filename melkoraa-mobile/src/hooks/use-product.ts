import { useCallback, useEffect, useState } from "react";

import { userFacingApiMessage } from "@/src/api/errors";
import type { ProductDetail } from "@/src/api/types/catalog";
import { catalogService } from "@/src/services/catalog.service";

export function useProduct(slug: string) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catalogService.getProduct(slug);
      setProduct(data);
    } catch (err) {
      setProduct(null);
      setError(userFacingApiMessage(err));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  return { product, loading, error, reload: load };
}
