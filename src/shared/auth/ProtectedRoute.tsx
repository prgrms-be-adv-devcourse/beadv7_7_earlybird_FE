import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "./authStore";
import type { AuthUser } from "./authStore";

export function ProtectedRoute({ roles }: { roles?: AuthUser["role"][] }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
