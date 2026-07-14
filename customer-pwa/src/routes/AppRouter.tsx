import { Routes, Route } from "react-router-dom";
import { CustomerLayout } from "@/layouts/CustomerLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";

import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { ProductListPage } from "@/pages/ProductListPage";
import { ProductDetailsPage } from "@/pages/ProductDetailsPage";
import { PrescriptionUploadPage } from "@/pages/PrescriptionUploadPage";
import { OfflinePage } from "@/pages/OfflinePage";
import { DashboardPage } from "@/pages/DashboardPage";
import { CartPage } from "@/pages/CartPage";
import { CheckoutPage } from "@/pages/CheckoutPage";
import { OrderSuccessPage } from "@/pages/OrderSuccessPage";
import { OrderListPage } from "@/pages/OrderListPage";
import { OrderDetailsPage } from "@/pages/OrderDetailsPage";
import { OrderTrackingPage } from "@/pages/OrderTrackingPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { SupportPage } from "@/pages/SupportPage";
import { SupportCaseNewPage } from "@/pages/SupportCaseNewPage";
import { SupportCaseDetailsPage } from "@/pages/SupportCaseDetailsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { ProfileEditPage } from "@/pages/ProfileEditPage";
import { AddressListPage } from "@/pages/AddressListPage";
import { AddressFormPage } from "@/pages/AddressFormPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:productId" element={<ProductDetailsPage />} />
        <Route path="/prescriptions/upload" element={<PrescriptionUploadPage />} />
        <Route path="/offline" element={<OfflinePage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
          <Route path="/orders" element={<OrderListPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
          <Route path="/orders/:orderId/track" element={<OrderTrackingPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/support/new" element={<SupportCaseNewPage />} />
          <Route path="/support/cases/:caseId" element={<SupportCaseDetailsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<ProfileEditPage />} />
          <Route path="/profile/addresses" element={<AddressListPage />} />
          <Route path="/profile/addresses/new" element={<AddressFormPage />} />
          <Route path="/profile/addresses/:addressId/edit" element={<AddressFormPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
