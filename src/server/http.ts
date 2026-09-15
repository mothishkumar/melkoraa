export const API_VERSION = "v1" as const;
export const API_PREFIX = `/api/${API_VERSION}` as const;

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
};

export type ApiSuccessBody<T> = {
  data: T;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function paginationMeta(
  page: number,
  pageSize: number,
  total: number,
): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
  };
}

export function jsonError(
  code: string,
  message: string,
  status: number,
  details?: Record<string, string>,
): Response {
  const body: ApiErrorBody = {
    error: details ? { code, message, details } : { code, message },
  };

  return Response.json(body, { status });
}

export function jsonOk<T>(data: T, status = 200): Response {
  return Response.json({ data } satisfies ApiSuccessBody<T>, { status });
}

export function jsonPage<T>(data: T[], pagination: PaginationMeta): Response {
  return Response.json({ data, pagination });
}

export function notImplemented(resource: string): Response {
  return jsonError(
    "NOT_IMPLEMENTED",
    `${resource} is not implemented in this phase.`,
    501,
  );
}
