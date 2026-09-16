export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
};

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, string>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function isAuthRequiredError(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 401;
}

export function userFacingApiMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof ApiClientError) {
    if (error.status === 401) return "Sign in to continue.";
    if (error.status === 403) {
      return "You do not have permission to perform this action.";
    }
    if (error.status === 404) return "That record was not found.";
    if (error.status === 409) {
      return error.message || "This change conflicts with the current state.";
    }
    if (error.status === 422) return error.message || "Check the form and try again.";
    if (error.status === 429) return "Too many requests. Try again shortly.";
    if (error.status >= 500) return fallback;
    return error.message || fallback;
  }
  return fallback;
}
