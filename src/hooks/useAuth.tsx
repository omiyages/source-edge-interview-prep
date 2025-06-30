
import { useAuthContext } from './useAuthContext';
import { useUserProfile } from './useUserProfile';

export const useAuth = () => {
  const authContext = useAuthContext();
  const { profile, loading: profileLoading } = useUserProfile(authContext.user);

  // More robust admin check
  const isAdmin = Boolean(
    authContext.user && 
    profile && 
    profile.role === 'admin' && 
    !authContext.loading && 
    !profileLoading
  );
  
  const loading = authContext.loading || profileLoading;

  return {
    ...authContext,
    profile,
    loading,
    isAdmin,
  };
};

// Re-export the AuthProvider for compatibility
export { AuthProvider } from './useAuthContext';
