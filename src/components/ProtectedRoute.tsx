
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, profile, loading, isAdmin } = useAuth();

  console.log('🛡️ ProtectedRoute check:', { 
    user: user?.email, 
    profile: profile?.role, 
    loading, 
    isAdmin, 
    requireAdmin 
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('🚫 No user found, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && !isAdmin) {
    console.log('🚫 Admin required but user is not admin, redirecting to home');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
