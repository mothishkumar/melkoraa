import type { NextFunction, Request, Response } from "express";

import { hasMinRole, hasStaffAccess, isAdmin, isManager } from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/auth/types";

import { sendError } from "../lib/express-response.js";

function ensureAuth(req: Request, res: Response): boolean {
  if (!req.auth?.user || !req.auth.profile) {
    sendError(res, "UNAUTHENTICATED", "Sign in required.", 401);
    return false;
  }
  if (!req.auth.profile) {
    sendError(res, "PROFILE_INCOMPLETE", "Your account profile is not ready.", 403);
    return false;
  }
  return true;
}

export function requireStaff(req: Request, res: Response, next: NextFunction) {
  if (!ensureAuth(req, res)) return;
  if (!hasStaffAccess(req.auth!.profile.role)) {
    return sendError(res, "FORBIDDEN", "You do not have permission to perform this action.", 403);
  }
  next();
}

export function requireManager(req: Request, res: Response, next: NextFunction) {
  if (!ensureAuth(req, res)) return;
  if (!isManager(req.auth!.profile.role)) {
    return sendError(res, "FORBIDDEN", "You do not have permission to perform this action.", 403);
  }
  next();
}

export function requireAdminRole(req: Request, res: Response, next: NextFunction) {
  if (!ensureAuth(req, res)) return;
  if (!isAdmin(req.auth!.profile.role)) {
    return sendError(res, "FORBIDDEN", "You do not have permission to perform this action.", 403);
  }
  next();
}

export function requireMinRole(minimum: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!ensureAuth(req, res)) return;
    if (!hasMinRole(req.auth!.profile.role, minimum)) {
      return sendError(res, "FORBIDDEN", "You do not have permission to perform this action.", 403);
    }
    next();
  };
}
