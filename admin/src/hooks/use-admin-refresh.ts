import { useContext } from "react";

import { AdminRefreshContext } from "@/contexts/admin-refresh-context";

export function useAdminRefresh() {
  const ctx = useContext(AdminRefreshContext);
  if (!ctx) {
    throw new Error("useAdminRefresh must be used within AdminRefreshProvider");
  }
  return ctx;
}
