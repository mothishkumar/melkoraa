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

export class AuthSessionExpiredError extends Error {
  constructor(message = "Your session has expired. Please sign in again.") {
    super(message);
    this.name = "AuthSessionExpiredError";
  }
}

export class NetworkError extends Error {
  constructor(message = "Unable to reach MELKORAA. Check your connection and try again.") {
    super(message);
    this.name = "NetworkError";
  }
}

export class TimeoutError extends Error {
  constructor(message = "The request timed out. Please try again.") {
    super(message);
    this.name = "TimeoutError";
  }
}

export function isAuthRequiredError(error: unknown): boolean {
  return (
    error instanceof ApiClientError &&
    (error.status === 401 || error.code === "UNAUTHENTICATED")
  );
}

export function userFacingApiMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof AuthSessionExpiredError) {
    return error.message;
  }
  if (error instanceof NetworkError || error instanceof TimeoutError) {
    return error.message;
  }
  if (error instanceof ApiClientError) {
    if (error.status === 401 || error.code === "UNAUTHENTICATED") {
      return "Sign in to continue.";
    }
    if (error.status === 403 || error.code === "FORBIDDEN") {
      return "You do not have permission to perform this action.";
    }
    if (error.status === 404) return "That record was not found.";
    if (error.status === 409) {
      return error.message || "This change conflicts with the current state.";
    }
    if (error.status === 422) return error.message || "Check the form and try again.";
    if (error.status === 429 || error.code === "RATE_LIMITED") {
      return "Too many requests. Try again shortly.";
    }
    if (error.status >= 500) return fallback;
    return error.message || fallback;
  }
  if (error instanceof Error && error.message.includes("Network request failed")) {
    return "Unable to reach MELKORAA. Check your connection and try again.";
  }
  return fallback;
}
