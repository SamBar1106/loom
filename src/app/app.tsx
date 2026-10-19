import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "@/app/require-auth";
import { TenantLayout } from "@/app/tenant-context";
import { CategoriesPage } from "@/pages/categories-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { ForgotPasswordPage } from "@/pages/forgot-password-page";
import { GoogleStartPage } from "@/pages/google-start-page";
import { InboxPage } from "@/pages/inbox-page";
import { InventoryPage } from "@/pages/inventory-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { OrdersPage } from "@/pages/orders-page";
import { PaymentsPage } from "@/pages/payments-page";
import { ProductFormPage } from "@/pages/product-form-page";
import { ProductsPage } from "@/pages/products-page";
import { SettingsPage } from "@/pages/settings-page";
import { SignInPage } from "@/pages/sign-in-page";
import { SignUpPage } from "@/pages/sign-up-page";

export function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/v1/auth/google/start" element={<GoogleStartPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<Navigate to="/t/daykodee" replace />} />
        <Route path="/t/:tenantSlug" element={<TenantLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/new" element={<ProductFormPage />} />
          <Route path="products/:productId" element={<ProductFormPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/payments" element={<PaymentsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
