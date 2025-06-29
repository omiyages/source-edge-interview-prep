
import { useAuthContext } from './useAuthContext';
import { useUserProfile } from './useUserProfile';

export const useAuth = () => {
  const authContext = useAuthContext();
  const { profile, loading: profileLoading } = useUserProfile(authContext.user);

  // Enhanced admin check with better validation
  const isAdmin = Boolean(
    authContext.user && 
    profile && 
    profile.role === 'admin' && 
    !authContext.loading && 
    !profileLoading
  );
  
  const loading = authContext.loading || profileLoading;

  console.log('🎯 Auth State:', {
    hasUser: !!authContext.user,
    userEmail: authContext.user?.email,
    hasProfile: !!profile,
    profileRole: profile?.role,
    isAdmin,
    authLoading: authContext.loading,
    profileLoading,
    totalLoading: loading
  });

  // Enhanced admin logging for debugging
  if (authContext.user && profile) {
    console.log('🔐 Admin Check Details:', {
      email: authContext.user.email,
      profileRole: profile.role,
      isRoleAdmin: profile.role === 'admin',
      finalIsAdmin: isAdmin
    });
  }

  return {
    ...authContext,
    profile,
    loading,
    isAdmin,
  };
};

// Re-export the AuthProvider for compatibility
export { AuthProvider } from './useAuthContext';
