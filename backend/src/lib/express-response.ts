import type { Response } from "express";

import type { PaginationMeta } from "@/server/http";

export function sendJson<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ data });
}

export function sendPage<T>(res: Response, data: T[], pagination: PaginationMeta) {
  return res.status(200).json({ data, pagination });
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  status: number,
  details?: Record<string, string>,
) {
  const body = details
    ? { error: { code, message, details } }
    : { error: { code, message } };
  return res.status(status).json(body);
}
