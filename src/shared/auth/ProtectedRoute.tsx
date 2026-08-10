import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "./authStore";

export function ProtectedRoute() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
