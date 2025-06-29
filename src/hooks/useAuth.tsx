
import { useAuthContext } from './useAuthContext';
import { useUserProfile } from './useUserProfile';

export const useAuth = () => {
  const authContext = useAuthContext();
  const { profile, loading: profileLoading } = useUserProfile(authContext.user);

  // More robust admin check with explicit logging
  const isAdmin = Boolean(
    authContext.user && 
    profile && 
    profile.role === 'admin' && 
    !authContext.loading && 
    !profileLoading
  );
  
  const loading = authContext.loading || profileLoading;

  console.log('🎯 Auth State Debug (useAuth):', {
    hasUser: !!authContext.user,
    userEmail: authContext.user?.email,
    hasProfile: !!profile,
    profileRole: profile?.role,
    authLoading: authContext.loading,
    profileLoading: profileLoading,
    finalIsAdmin: isAdmin,
    totalLoading: loading,
    canAccessAdmin: isAdmin && !loading
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
