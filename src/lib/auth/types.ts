import type { User } from "@supabase/supabase-js";

import type { UserRole } from "@/types";

export type { UserRole };

export const USER_ROLES = ["customer", "staff", "manager", "admin"] as const;

export type SessionUser = User;

export type Profile = {
  id: string;
  userId: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthenticatedContext = {
  user: SessionUser;
  profile: Profile;
};

export function isUserRole(value: unknown): value is UserRole {
  return (
    value === "customer" ||
    value === "staff" ||
    value === "manager" ||
    value === "admin"
  );
}
