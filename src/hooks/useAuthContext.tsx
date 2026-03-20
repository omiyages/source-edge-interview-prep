
import React, { createContext, useContext } from 'react';
import { useUser, useClerk } from '@clerk/react';

export interface MinimalUser {
  id: string;   // Clerk user ID (e.g. "user_2abc") — directly used as profiles.id
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
  // profiles.id is the Clerk user ID — no UUID mapping needed.
  const mappedUser: MinimalUser | null =
    isSignedIn && user
      ? {
          id: user.id,
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
