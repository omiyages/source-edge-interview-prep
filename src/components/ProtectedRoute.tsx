
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, profile, loading, isAdmin } = useAuth();

  console.log('🛡️ ProtectedRoute:', { 
    userEmail: user?.email || 'No user', 
    profileRole: profile?.role || 'No profile', 
    loading, 
    isAdmin, 
    requireAdmin,
    shouldAllowAccess: !requireAdmin || isAdmin
  });

  // Show loading while authentication is in progress
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

  // Redirect to auth if no user
  if (!user) {
    console.log('🚫 No authenticated user - redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // For admin routes, check if user has admin role
  if (requireAdmin) {
    if (!profile) {
      console.log('🚫 No profile loaded for admin check');
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      );
    }
    
    if (!isAdmin) {
      console.log('🚫 User is not admin:', { 
        email: user.email, 
        role: profile.role,
        isAdmin 
      });
      return <Navigate to="/" replace />;
    }
    
    console.log('✅ Admin access granted');
  }

  return <>{children}</>;
};
