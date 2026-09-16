import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { StaffProtectedRoute } from "@/components/staff-protected-route";
import { AuthProvider } from "@/contexts/auth-context";
import { AdminLoginForm } from "@/features/auth/components/login-form";
import { AdminLayout } from "@/layouts/admin-layout";
import { AuditLogsPage } from "@/pages/audit-logs-page";
import { CollectionsPage } from "@/pages/collections-page";
import { CustomersPage } from "@/pages/customers-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { DropDetailPage } from "@/pages/drop-detail-page";
import { DropsPage } from "@/pages/drops-page";
import { InventoryPage } from "@/pages/inventory-page";
import { NewProductPage } from "@/pages/new-product-page";
import { OrderDetailPage } from "@/pages/order-detail-page";
import { OrdersPage } from "@/pages/orders-page";
import { ProductDetailPage } from "@/pages/product-detail-page";
import { ProductsPage } from "@/pages/products-page";

function UnauthorizedPage() {
  return (
    <div className="admin-shell flex min-h-screen items-center justify-center bg-[#f3f4f6] px-4 text-center">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Access denied</h1>
        <p className="mt-2 text-sm text-zinc-500">Your account does not have permission to use the operations console.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AdminLoginForm />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route
            element={
              <StaffProtectedRoute>
                <AdminLayout />
              </StaffProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route
              path="products/new"
              element={
                <StaffProtectedRoute minimum="manager">
                  <NewProductPage />
                </StaffProtectedRoute>
              }
            />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="drops" element={<DropsPage />} />
            <Route path="drops/:id" element={<DropDetailPage />} />
            <Route path="collections" element={<CollectionsPage />} />
            <Route
              path="audit-logs"
              element={
                <StaffProtectedRoute minimum="manager">
                  <AuditLogsPage />
                </StaffProtectedRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
