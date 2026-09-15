import { AppError } from "@/server/errors";
import { notFound } from "next/navigation";

export function notFoundIfMissing(error: unknown): never {
  if (error instanceof AppError && error.status === 404) {
    notFound();
  }
  throw error;
}
