
import { useAuthContext } from './useAuthContext';
import { useUserProfile } from './useUserProfile';

export const useAuth = () => {
  const authContext = useAuthContext();
  const { profile, loading: profileLoading } = useUserProfile(authContext.user);

  // Simple admin check - user must exist, profile must exist, and role must be admin
  const isAdmin = Boolean(
    authContext.user && 
    profile && 
    profile.role === 'admin' && 
    !authContext.loading && 
    !profileLoading
  );
  
  const loading = authContext.loading || profileLoading;

  console.log('🎯 Auth State Debug:', {
    hasUser: !!authContext.user,
    userEmail: authContext.user?.email,
    hasProfile: !!profile,
    profileRole: profile?.role,
    isAdmin,
    authLoading: authContext.loading,
    profileLoading,
    totalLoading: loading
  });

  return {
    ...authContext,
    profile,
    loading,
    isAdmin,
  };
};

// Re-export the AuthProvider for compatibility
export { AuthProvider } from './useAuthContext';
