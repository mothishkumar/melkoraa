import { env } from "@/src/config/env";
import {
  ApiClientError,
  AuthSessionExpiredError,
  NetworkError,
  TimeoutError,
  type ApiErrorBody,
} from "@/src/api/errors";
import type { PaginatedResponse } from "@/src/api/types/common";

const REQUEST_TIMEOUT_MS = 30000;

type TokenProvider = () => Promise<string | null>;
type RefreshSessionFn = () => Promise<string | null>;
type ClearSessionFn = () => Promise<void>;

let accessTokenProvider: TokenProvider | null = null;
let refreshSessionFn: RefreshSessionFn | null = null;
let clearSessionFn: ClearSessionFn | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export function setAccessTokenProvider(provider: TokenProvider | null): void {
  accessTokenProvider = provider;
}

export function setSessionHandlers(
  refresh: RefreshSessionFn | null,
  clear: ClearSessionFn | null,
): void {
  refreshSessionFn = refresh;
  clearSessionFn = clear;
}

function buildUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${env.apiUrl}${normalized}`;
}

function buildQuery(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function buildHeaders(
  init?: RequestInit,
  authenticated = false,
): Promise<HeadersInit> {
  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init?.body && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (authenticated && accessTokenProvider) {
    const token = await accessTokenProvider();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new TimeoutError();
    }
    if (error instanceof TypeError) {
      throw new NetworkError();
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const payload = await parseJson(response);
  if (!response.ok) {
    const body = payload as ApiErrorBody | null;
    throw new ApiClientError(
      response.status,
      body?.error?.code ?? "INTERNAL",
      body?.error?.message ?? "Something went wrong. Please try again.",
      body?.error?.details,
    );
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

async function refreshAccessTokenOnce(): Promise<string | null> {
  if (!refreshSessionFn) return null;
  if (!refreshInFlight) {
    refreshInFlight = refreshSessionFn().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function executeRequest<T>(
  path: string,
  init?: RequestInit & { authenticated?: boolean },
  allowRetry = true,
): Promise<T> {
  const { authenticated = false, ...requestInit } = init ?? {};

  try {
    const response = await fetchWithTimeout(buildUrl(path), {
      ...requestInit,
      headers: await buildHeaders(requestInit, authenticated),
    });
    return await handleResponse<T>(response);
  } catch (error) {
    if (
      allowRetry &&
      authenticated &&
      error instanceof ApiClientError &&
      error.status === 401
    ) {
      const refreshed = await refreshAccessTokenOnce();
      if (refreshed) {
        return executeRequest<T>(path, init, false);
      }
      await clearSessionFn?.();
      throw new AuthSessionExpiredError();
    }
    throw error;
  }
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit & { authenticated?: boolean },
): Promise<T> {
  return executeRequest<T>(path, init, true);
}

export async function apiPage<T>(
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
  authenticated = false,
): Promise<PaginatedResponse<T>> {
  const url = buildUrl(`${path}${buildQuery(query)}`);

  async function fetchPage(allowRetry: boolean): Promise<PaginatedResponse<T>> {
    try {
      const response = await fetchWithTimeout(url, {
        headers: await buildHeaders(undefined, authenticated),
      });
      const payload = (await parseJson(response)) as PaginatedResponse<T> & {
        error?: ApiErrorBody["error"];
      } | null;

      if (!response.ok) {
        throw new ApiClientError(
          response.status,
          payload?.error?.code ?? "INTERNAL",
          payload?.error?.message ?? "Something went wrong. Please try again.",
          payload?.error?.details,
        );
      }

      return {
        data: payload?.data ?? [],
        pagination: payload?.pagination ?? {
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 0,
        },
      };
    } catch (error) {
      if (
        allowRetry &&
        authenticated &&
        error instanceof ApiClientError &&
        error.status === 401
      ) {
        const refreshed = await refreshAccessTokenOnce();
        if (refreshed) {
          return fetchPage(false);
        }
        await clearSessionFn?.();
        throw new AuthSessionExpiredError();
      }
      throw error;
    }
  }

  return fetchPage(true);
}
