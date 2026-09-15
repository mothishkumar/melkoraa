export const API_VERSION = "v1" as const;
export const API_PREFIX = `/api/${API_VERSION}` as const;

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

export type ApiSuccessBody<T> = {
  data: T;
};

export function jsonError(
  code: string,
  message: string,
  status: number,
): Response {
  const body: ApiErrorBody = {
    error: { code, message },
  };

  return Response.json(body, { status });
}

export function notImplemented(resource: string): Response {
  return jsonError(
    "NOT_IMPLEMENTED",
    `${resource} is not implemented in this phase.`,
    501,
  );
}
