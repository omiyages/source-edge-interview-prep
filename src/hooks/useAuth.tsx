
import { useAuthContext } from './useAuthContext';
import { useUserProfile } from './useUserProfile';

export const useAuth = () => {
  const authContext = useAuthContext();
  const { profile, loading: profileLoading } = useUserProfile(authContext.user);

  const isAdmin = profile?.role === 'admin';
  const loading = authContext.loading || profileLoading;

  console.log('🎯 Current auth state:', {
    userEmail: authContext.user?.email,
    profileRole: profile?.role,
    isAdmin,
    loading,
    profileExists: !!profile
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
