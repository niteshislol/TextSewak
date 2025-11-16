import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const isAdminAuthenticated = localStorage.getItem("admin_authenticated");

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
