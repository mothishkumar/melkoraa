import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/contexts/auth-context";
import { hasStaffAccess } from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/auth/types";

export function StaffProtectedRoute({
  children,
  minimum = "staff",
}: {
  children: React.ReactNode;
  minimum?: "staff" | "manager";
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center bg-[#f3f4f6] text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  const role = user?.role as UserRole | undefined;
  if (!hasStaffAccess(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (minimum === "manager" && role !== "manager" && role !== "admin") {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
