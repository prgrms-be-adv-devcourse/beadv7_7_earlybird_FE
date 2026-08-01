import { Routes, Route } from "react-router-dom";
import { Layout } from "./Layout";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { SignupPage } from "../features/auth/pages/SignupPage";
import { ProjectListPage } from "../features/projects/pages/ProjectListPage";
import { ProjectDetailPage } from "../features/projects/pages/ProjectDetailPage";
import { ProtectedRoute } from "../shared/auth/ProtectedRoute";
import { CartPage } from "../features/cart/pages/CartPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<ProjectListPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<CartPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
