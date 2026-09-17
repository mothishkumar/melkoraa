export type UserRole = "customer" | "staff" | "manager" | "admin";

export type SessionUser = {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
};

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

export function isUserRole(value: unknown): value is UserRole {
  return value === "customer" || value === "staff" || value === "manager" || value === "admin";
}
