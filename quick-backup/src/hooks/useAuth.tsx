
// ABOUTME: Optimized authentication hook with consolidated profile management
// ABOUTME: Uses the new optimized profile service for better performance and security

import { useAuthContext } from './useAuthContext';
import { useOptimizedUserProfile } from './useOptimizedUserProfile';

export const useAuth = () => {
  const authContext = useAuthContext();
  const { profile, loading: profileLoading, refetch } = useOptimizedUserProfile(authContext.user);

  // More robust admin check with memoization
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
    refetchProfile: refetch,
  };
};

// Re-export the AuthProvider for compatibility
export { AuthProvider } from './useAuthContext';
