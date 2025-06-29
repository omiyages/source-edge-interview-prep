
import { useAuthContext } from './useAuthContext';
import { useUserProfile } from './useUserProfile';

export const useAuth = () => {
  const authContext = useAuthContext();
  const { profile, loading: profileLoading } = useUserProfile(authContext.user);

  // Enhanced admin check with better logging
  const isAdmin = Boolean(
    authContext.user && 
    profile && 
    profile.role === 'admin' && 
    !authContext.loading && 
    !profileLoading
  );
  
  const loading = authContext.loading || profileLoading;

  console.log('🎯 Auth State Debug (Enhanced):', {
    step1_hasUser: !!authContext.user,
    step2_userEmail: authContext.user?.email,
    step3_hasProfile: !!profile,
    step4_profileRole: profile?.role,
    step5_authLoading: authContext.loading,
    step6_profileLoading: profileLoading,
    step7_finalIsAdmin: isAdmin,
    step8_totalLoading: loading,
    step9_shouldBeAdmin: authContext.user?.email === 'namtae.quicksit@gmail.com'
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
