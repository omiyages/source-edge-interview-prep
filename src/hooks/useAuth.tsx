
// ABOUTME: Optimized authentication hook with consolidated profile management
// ABOUTME: Uses the new optimized profile service for better performance and security

import { useAuthContext } from './useAuthContext';
import { useOptimizedUserProfile } from './useOptimizedUserProfile';

export const useAuth = () => {
  const authContext = useAuthContext();
  const {
    profile,
    loading: profileLoading,
    loadFailed: profileLoadFailed,
    refetch,
    hasClerkJwt,
    clerkClientReady,
  } = useOptimizedUserProfile(authContext.user);

  // More robust admin check with memoization
  const isAdmin = Boolean(
    authContext.user &&
    profile &&
    profile.role === 'admin' &&
    !authContext.loading &&
    !profileLoading
  );

  const loading = authContext.loading || profileLoading;

  /** Run Supabase role queries only after Clerk JWT is set — avoids caching anon-only (active) rows for admins. */
  const rolesRlsReady =
    !authContext.loading &&
    (!authContext.user || (clerkClientReady && hasClerkJwt));

  return {
    ...authContext,
    profile,
    loading,
    isAdmin,
    profileLoadFailed,
    refetchProfile: refetch,
    hasClerkJwt,
    clerkClientReady,
    rolesRlsReady,
  };
};

// Re-export the AuthProvider for compatibility
export { AuthProvider } from './useAuthContext';
