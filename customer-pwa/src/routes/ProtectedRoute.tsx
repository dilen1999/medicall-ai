import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setRedirectPath = useAuthStore((state) => state.setRedirectPath);
  const location = useLocation();

  if (!isAuthenticated) {
    setRedirectPath(location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
