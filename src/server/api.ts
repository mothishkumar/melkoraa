import { ZodError } from "zod";

import { logger } from "@/lib/logger";
import { AppError, validationError } from "@/server/errors";
import { jsonError } from "@/server/http";

export function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; cause?: { code?: string } };
  return candidate.code === "23505" || candidate.cause?.code === "23505";
}

export function isCheckViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; cause?: { code?: string } };
  return candidate.code === "23514" || candidate.cause?.code === "23514";
}

export function uniqueConstraintMessage(error: unknown, fallback: string): string {
  let text = "";
  if (error instanceof Error) {
    text = error.message.toLowerCase();
  } else if (error && typeof error === "object" && "message" in error) {
    text = String((error as { message: unknown }).message).toLowerCase();
  }
  if (text.includes("slug")) return "A record with this slug already exists.";
  if (text.includes("sku")) return "A variant with this SKU already exists.";
  if (text.includes("wishlist")) return "This product is already in your wishlist.";
  if (text.includes("order_number")) return "That order number is already in use.";
  if (text.includes("idempotency")) return "A checkout with this key already exists.";
  if (text.includes("provider_event")) return "This payment event was already processed.";
  if (text.includes("provider_order")) return "This provider order is already attached.";
  return fallback;
}

export function fieldErrorsFromZod(error: ZodError): Record<string, string> {
  const flattened = error.flatten().fieldErrors;
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flattened)) {
    const first = Array.isArray(messages) ? messages[0] : undefined;
    if (typeof first === "string") result[key] = first;
  }
  if (error.issues.length > 0 && Object.keys(result).length === 0) {
    const first = error.issues[0];
    result.form = first?.message ?? "Invalid input.";
  }
  return result;
}

export function toErrorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return jsonError(error.code, error.message, error.status, error.details);
  }

  if (error instanceof ZodError) {
    return jsonError(
      "VALIDATION_ERROR",
      "Invalid request.",
      400,
      fieldErrorsFromZod(error),
    );
  }

  if (isUniqueViolation(error)) {
    return jsonError(
      "CONFLICT",
      uniqueConstraintMessage(error, "This record already exists."),
      409,
    );
  }

  if (isCheckViolation(error)) {
    return jsonError(
      "INVENTORY_CONFLICT",
      "The inventory change could not be applied.",
      409,
    );
  }

  logger.error("api.unexpected_error", {
    name: error instanceof Error ? error.name : "unknown",
  });
  return jsonError("INTERNAL", "Something went wrong. Please try again.", 500);
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw validationError("Request body must be JSON.");
  }
}

export async function handleApi(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    return toErrorResponse(error);
  }
}
