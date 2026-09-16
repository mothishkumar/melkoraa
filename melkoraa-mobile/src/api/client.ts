import { env } from "@/src/config/env";
import { ApiClientError, type ApiErrorBody } from "@/src/api/errors";
import type { PaginatedResponse } from "@/src/api/types/common";

type TokenProvider = () => Promise<string | null>;

let accessTokenProvider: TokenProvider | null = null;

export function setAccessTokenProvider(provider: TokenProvider | null): void {
  accessTokenProvider = provider;
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

export async function apiRequest<T>(
  path: string,
  init?: RequestInit & { authenticated?: boolean },
): Promise<T> {
  const { authenticated = false, ...requestInit } = init ?? {};
  const response = await fetch(buildUrl(path), {
    ...requestInit,
    headers: await buildHeaders(requestInit, authenticated),
  });
  return handleResponse<T>(response);
}

export async function apiPage<T>(
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
  authenticated = false,
): Promise<PaginatedResponse<T>> {
  const response = await fetch(buildUrl(`${path}${buildQuery(query)}`), {
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
}
