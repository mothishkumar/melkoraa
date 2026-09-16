import { useCallback, useEffect, useState } from "react";

import { userFacingApiMessage } from "@/src/api/errors";
import { catalogService, type HomeFeed } from "@/src/services/catalog.service";

type HomeState = {
  data: HomeFeed | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
};

export function useHomeFeed() {
  const [state, setState] = useState<HomeState>({
    data: null,
    loading: true,
    refreshing: false,
    error: null,
  });

  const load = useCallback(async (refreshing = false) => {
    setState((prev) => ({
      ...prev,
      loading: !refreshing && !prev.data,
      refreshing,
      error: null,
    }));
    try {
      const data = await catalogService.getHomeFeed();
      setState({ data, loading: false, refreshing: false, error: null });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        refreshing: false,
        error: userFacingApiMessage(error),
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    ...state,
    refresh: () => load(true),
  };
}
