import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { fieldErrorsFromZod, isCheckViolation, isUniqueViolation, uniqueConstraintMessage } from "@/server/api";
import { logger } from "@/lib/logger";

import { sendError } from "./express-response.js";

export async function handleRoute(
  res: Response,
  fn: () => Promise<{ status?: number; body: unknown } | void>,
) {
  try {
    const result = await fn();
    if (result) {
      return res.status(result.status ?? 200).json(result.body);
    }
  } catch (error) {
    if (error instanceof ZodError) {
      const details = fieldErrorsFromZod(error);
      return sendError(res, "VALIDATION_ERROR", "Invalid request.", 400, details);
    }
    if (isUniqueViolation(error)) {
      return sendError(
        res,
        "CONFLICT",
        uniqueConstraintMessage(error, "This record already exists."),
        409,
      );
    }
    if (isCheckViolation(error)) {
      return sendError(res, "INVENTORY_CONFLICT", "The inventory change could not be applied.", 409);
    }
    logger.error("api.unexpected_error", {
      name: error instanceof Error ? error.name : "unknown",
    });
    return sendError(res, "INTERNAL", "Something went wrong. Please try again.", 500);
  }
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void fn(req, res, next).catch(next);
  };
}
