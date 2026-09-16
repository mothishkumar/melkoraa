import { useCallback, useEffect, useRef, useState } from "react";

import { userFacingApiMessage } from "@/src/api/errors";
import type { ProductListItem, ProductListQuery } from "@/src/api/types/catalog";
import { catalogService } from "@/src/services/catalog.service";
import type { SortValue } from "@/src/utils/product";

type ProductsState = {
  items: ProductListItem[];
  page: number;
  totalPages: number;
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
};

const PAGE_SIZE = 12;

export function useProductList(options?: {
  search?: string;
  category?: string;
  sort?: SortValue;
  enabled?: boolean;
}) {
  const enabled = options?.enabled ?? true;
  const [state, setState] = useState<ProductsState>({
    items: [],
    page: 0,
    totalPages: 0,
    loading: true,
    refreshing: false,
    loadingMore: false,
    error: null,
    hasMore: true,
  });
  const queryRef = useRef(options);
  queryRef.current = options;

  const buildQuery = useCallback(
    (page: number): ProductListQuery => ({
      page,
      pageSize: PAGE_SIZE,
      search: queryRef.current?.search || undefined,
      category: queryRef.current?.category || undefined,
      sort: queryRef.current?.sort || "newest",
    }),
    [],
  );

  const loadPage = useCallback(async (page: number, mode: "initial" | "refresh" | "more") => {
    setState((prev) => ({
      ...prev,
      loading: mode === "initial",
      refreshing: mode === "refresh",
      loadingMore: mode === "more",
      error: null,
    }));

    try {
      const response = await catalogService.listProducts(buildQuery(page));
      setState((prev) => ({
        items: mode === "more" ? [...prev.items, ...response.data] : response.data,
        page: response.pagination.page,
        totalPages: response.pagination.totalPages,
        loading: false,
        refreshing: false,
        loadingMore: false,
        error: null,
        hasMore: response.pagination.page < response.pagination.totalPages,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        refreshing: false,
        loadingMore: false,
        error: userFacingApiMessage(error),
      }));
    }
  }, [buildQuery]);

  useEffect(() => {
    if (!enabled) {
      setState({
        items: [],
        page: 0,
        totalPages: 0,
        loading: false,
        refreshing: false,
        loadingMore: false,
        error: null,
        hasMore: false,
      });
      return;
    }
    loadPage(1, "initial");
  }, [enabled, options?.search, options?.category, options?.sort, loadPage]);

  return {
    ...state,
    refresh: () => loadPage(1, "refresh"),
    loadMore: () => {
      if (!state.loadingMore && state.hasMore && !state.loading) {
        loadPage(state.page + 1, "more");
      }
    },
  };
}
