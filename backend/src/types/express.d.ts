import type { Profile, SessionUser } from "@/lib/auth/types";

declare module "express-serve-static-core" {
  interface Request {
    auth: { user: SessionUser; profile: Profile } | null;
  }
}
