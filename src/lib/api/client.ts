type ApiErrorPayload = {
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
};

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, string>;

  constructor(status: number, code: string, message: string, details?: Record<string, string>) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function userFacingApiMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error instanceof ApiClientError) {
    if (error.status === 401) return "Sign in to continue.";
    return error.message || fallback;
  }
  return fallback;
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    const body = payload as ApiErrorPayload | null;
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

export async function apiPage<T>(path: string): Promise<{
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}> {
  const response = await fetch(path, { headers: { Accept: "application/json" } });
  const payload = (await parseJson(response)) as {
    data?: T[];
    pagination?: { page: number; pageSize: number; total: number; totalPages: number };
    error?: ApiErrorPayload["error"];
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
    pagination: payload?.pagination ?? { page: 1, pageSize: 20, total: 0, totalPages: 0 },
  };
}
