
// ABOUTME: Protected route component that handles authentication checks
// ABOUTME: Redirects unauthenticated users to login page with proper error handling
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading, isAdmin, profile } = useAuth();
  const location = useLocation();

  // Show loading spinner while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-semibold">Authenticating...</p>
        </div>
      </div>
    );
  }

  // If no user, redirect to auth page
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If user exists but profile hasn't loaded yet, wait for it before checking admin
  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-semibold">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  // If admin is required but user is not admin, redirect to dashboard
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
