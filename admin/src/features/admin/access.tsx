"use client";

import { createContext, useContext, type ReactNode } from "react";

import { isManager } from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/auth/types";

type AdminAccess = {
  role: UserRole;
  canMutate: boolean;
};

const AdminAccessContext = createContext<AdminAccess>({
  role: "staff",
  canMutate: false,
});

export function AdminAccessProvider({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  return (
    <AdminAccessContext.Provider value={{ role, canMutate: isManager(role) }}>
      {children}
    </AdminAccessContext.Provider>
  );
}

export function useAdminAccess() {
  return useContext(AdminAccessContext);
}
