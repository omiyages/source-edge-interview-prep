
// ABOUTME: Protected route component that handles authentication checks
// ABOUTME: Redirects unauthenticated users to login page with proper error handling
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading, isAdmin, profile, profileLoadFailed, refetchProfile } = useAuth();
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
    return <Navigate to="/" replace />;
  }

  // If profile failed to load, show error with retry instead of spinning forever
  if (!profile && profileLoadFailed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm">
          <p className="text-foreground font-semibold mb-2">Unable to load your profile</p>
          <p className="text-muted-foreground text-sm mb-4">
            There was an issue connecting to the database. Check the browser console for details.
          </p>
          <button
            onClick={() => refetchProfile()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If profile is still loading (not yet attempted), wait briefly
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
