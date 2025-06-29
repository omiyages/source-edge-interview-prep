
import { useAuthContext } from './useAuthContext';
import { useUserProfile } from './useUserProfile';

export const useAuth = () => {
  const authContext = useAuthContext();
  const { profile, loading: profileLoading } = useUserProfile(authContext.user);

  // Simplified admin check with better logging
  const isAdmin = Boolean(profile?.role === 'admin');
  const loading = authContext.loading || profileLoading;

  console.log('🎯 Auth State Summary:', {
    userEmail: authContext.user?.email || 'No user',
    profileRole: profile?.role || 'No profile',
    isAdmin,
    loading,
    authComplete: !authContext.loading,
    profileComplete: !profileLoading
  });

  // Only log admin details if we have both user and profile
  if (authContext.user && profile && !loading) {
    console.log('🔐 Admin Access Check:', {
      email: authContext.user.email,
      profileRole: profile.role,
      isAdminUser: profile.role === 'admin',
      shouldHaveAccess: profile.role === 'admin'
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
