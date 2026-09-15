export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, string>;

  constructor(
    code: string,
    message: string,
    status: number,
    details?: Record<string, string>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function validationError(
  message = "Invalid request.",
  details?: Record<string, string>,
) {
  return new AppError("VALIDATION_ERROR", message, 400, details);
}

export function notFoundError(code: string, message: string) {
  return new AppError(code, message, 404);
}

export function conflictError(code: string, message: string) {
  return new AppError(code, message, 409);
}

export function unprocessableError(code: string, message: string) {
  return new AppError(code, message, 422);
}

export function serviceUnavailableError(code: string, message: string) {
  return new AppError(code, message, 503);
}
