import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { StaffProtectedRoute } from "@/components/staff-protected-route";
import { AuthProvider } from "@/contexts/auth-context";
import { AdminLayout } from "@/layouts/admin-layout";

const AdminLoginForm = lazy(async () => ({ default: (await import("@/features/auth/components/login-form")).AdminLoginForm }));
const AuditLogsPage = lazy(async () => ({ default: (await import("@/pages/audit-logs-page")).AuditLogsPage }));
const CategoriesPage = lazy(async () => ({ default: (await import("@/pages/categories-page")).CategoriesPage }));
const CollectionsPage = lazy(async () => ({ default: (await import("@/pages/collections-page")).CollectionsPage }));
const CustomersPage = lazy(async () => ({ default: (await import("@/pages/customers-page")).CustomersPage }));
const DashboardPage = lazy(async () => ({ default: (await import("@/pages/dashboard-page")).DashboardPage }));
const DropDetailPage = lazy(async () => ({ default: (await import("@/pages/drop-detail-page")).DropDetailPage }));
const DropsPage = lazy(async () => ({ default: (await import("@/pages/drops-page")).DropsPage }));
const InventoryPage = lazy(async () => ({ default: (await import("@/pages/inventory-page")).InventoryPage }));
const NewProductPage = lazy(async () => ({ default: (await import("@/pages/new-product-page")).NewProductPage }));
const OrderDetailPage = lazy(async () => ({ default: (await import("@/pages/order-detail-page")).OrderDetailPage }));
const OrdersPage = lazy(async () => ({ default: (await import("@/pages/orders-page")).OrdersPage }));
const PaymentsPage = lazy(async () => ({ default: (await import("@/pages/payments-page")).PaymentsPage }));
const ProductDetailPage = lazy(async () => ({ default: (await import("@/pages/product-detail-page")).ProductDetailPage }));
const ProductsPage = lazy(async () => ({ default: (await import("@/pages/products-page")).ProductsPage }));

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
        <Suspense
          fallback={
            <div className="admin-shell flex min-h-screen items-center justify-center bg-[#f3f4f6] text-sm text-zinc-500">
              Loading…
            </div>
          }
        >
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
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="payments" element={<PaymentsPage />} />
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
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
