import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export function PublicRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const redirectPath = useAuthStore((state) => state.redirectPath);

  if (isAuthenticated) {
    return <Navigate to={redirectPath ?? "/dashboard"} replace />;
  }

  return <Outlet />;
}
