
import React, { createContext, useContext } from 'react';
import { useUser, useClerk } from '@clerk/react';

export interface MinimalUser {
  id: string;   // Supabase UUID from publicMetadata.supabase_uuid (set by clerk-webhook)
  email: string;
}

interface AuthContextType {
  user: MinimalUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  // Map Clerk's UserResource to the minimal shape the app needs.
  // The Supabase UUID is written to publicMetadata.supabase_uuid by the
  // clerk-webhook Edge Function on user.created. Until the webhook fires
  // (first sign-up only), id falls back to the Clerk user ID so the session
  // isn't blocked — the profile will be created on next load once the webhook
  // has completed.
  const mappedUser: MinimalUser | null =
    isSignedIn && user
      ? {
          id: (user.publicMetadata?.supabase_uuid as string) ?? user.id,
          email: user.primaryEmailAddress?.emailAddress ?? '',
        }
      : null;

  const value: AuthContextType = {
    user: mappedUser,
    loading: !isLoaded,
    signOut: () => clerkSignOut({ redirectUrl: '/auth' }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
