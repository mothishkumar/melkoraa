import { useCallback, useEffect, useState } from "react";

import { userFacingApiMessage } from "@/src/api/errors";
import type { PublicCategory } from "@/src/api/types/catalog";
import { catalogService } from "@/src/services/catalog.service";

export function useCategories() {
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await catalogService.listCategories(1, 50);
      setCategories(response.data);
      setError(null);
    } catch (err) {
      setError(userFacingApiMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { categories, loading, error, reload: load };
}
