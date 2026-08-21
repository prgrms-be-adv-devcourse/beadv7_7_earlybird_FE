import { Routes, Route } from "react-router-dom";
import { Layout } from "./Layout";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { SignupPage } from "../features/auth/pages/SignupPage";
import { HomePage } from "../features/home/pages/HomePage";
import { ProjectListPage } from "../features/projects/pages/ProjectListPage";
import { ProjectDetailPage } from "../features/projects/pages/ProjectDetailPage";
import { ProjectCreatePage } from "../features/projects/pages/ProjectCreatePage";
import { MyProjectsPage } from "../features/projects/pages/MyProjectsPage";
import { ProtectedRoute } from "../shared/auth/ProtectedRoute";
import { CartPage } from "../features/cart/pages/CartPage";
import { OrderListPage } from "../features/orders/pages/OrderListPage";
import { OrderDetailPage } from "../features/orders/pages/OrderDetailPage";
import { CheckoutPage } from "../features/payments/pages/CheckoutPage";
import { SettlementDashboardPage } from "../features/settlements/pages/SettlementDashboardPage";
import { SettlementDetailPage } from "../features/settlements/pages/SettlementDetailPage";
import { CreatorApplyPage } from "../features/creator/pages/CreatorApplyPage";
import { CategoryAdminPage } from "../features/admin/pages/CategoryAdminPage";
import { ProjectApprovalPage } from "../features/admin/pages/ProjectApprovalPage";
import { CreatorApprovalPage } from "../features/admin/pages/CreatorApprovalPage";
import { SettlementAdminPage } from "../features/admin/pages/SettlementAdminPage";
import { SupportButtonPreview } from "../dev/SupportButtonPreview";
import { HomePreview } from "../dev/HomePreview";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects" element={<ProjectListPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/dev/support-button-preview" element={<SupportButtonPreview />} />
        <Route path="/dev/home-preview" element={<HomePreview />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/projects/new" element={<ProjectCreatePage />} />
          <Route path="/projects/me" element={<MyProjectsPage />} />
          <Route path="/creator/apply" element={<CreatorApplyPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrderListPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/orders/:id/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/:id" element={<CheckoutPage />} />
          <Route path="/admin/categories" element={<CategoryAdminPage />} />
          <Route path="/admin/approvals" element={<ProjectApprovalPage />} />
          <Route path="/admin/creators" element={<CreatorApprovalPage />} />
          <Route path="/admin/settlements" element={<SettlementAdminPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={["CREATOR"]} />}>
          <Route path="/settlements" element={<SettlementDashboardPage />} />
          <Route path="/settlements/:settlementId" element={<SettlementDetailPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
