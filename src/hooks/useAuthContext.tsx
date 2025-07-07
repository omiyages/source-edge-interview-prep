
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { rateLimitService } from '@/services/rateLimitService';
import { logAuthFailure, logRateLimitExceeded } from '@/utils/securityLogger';
import { validateEmail, sanitizeInput } from '@/services/secureAuthService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; isRateLimited?: boolean; lockedUntil?: number }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔄 Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('❌ Error getting session:', error);
          setUser(null);
        } else {
          console.log('✅ Initial session:', session?.user?.email || 'No user');
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('❌ Unexpected error getting session:', error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('✅ Auth initialization complete');
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user');
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Sanitize and validate input
      const cleanEmail = sanitizeInput(email);
      const cleanPassword = sanitizeInput(password);
      
      if (!validateEmail(cleanEmail)) {
        logAuthFailure('Invalid email format', cleanEmail);
        return { success: false, error: 'Please enter a valid email address' };
      }
      
      // Check rate limiting
      const rateLimitCheck = rateLimitService.canAttemptLogin(cleanEmail);
      if (!rateLimitCheck.allowed) {
        const remainingTime = Math.ceil((rateLimitCheck.lockedUntil! - Date.now()) / 1000);
        logRateLimitExceeded(`Login blocked for ${cleanEmail}`, cleanEmail);
        
        return { 
          success: false, 
          error: `Too many failed attempts. Account locked for ${remainingTime} seconds.`,
          isRateLimited: true,
          lockedUntil: rateLimitCheck.lockedUntil
        };
      }
      
      console.log('🔄 Signing in:', cleanEmail);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) {
        // Record failed attempt
        const rateLimitResult = rateLimitService.recordFailedAttempt(cleanEmail);
        logAuthFailure(`Failed login attempt: ${error.message}`, cleanEmail);
        
        let errorMessage = error.message;
        if (rateLimitResult.isLocked) {
          const lockoutTime = Math.ceil((rateLimitResult.lockedUntil! - Date.now()) / 1000);
          errorMessage = `Invalid credentials. Account locked for ${lockoutTime} seconds due to multiple failed attempts.`;
          logRateLimitExceeded(`Account locked after ${rateLimitService['maxAttempts']} failed attempts`, cleanEmail);
        } else if (rateLimitResult.remainingAttempts <= 2) {
          errorMessage = `${error.message}. ${rateLimitResult.remainingAttempts} attempts remaining before account lockout.`;
        }
        
        return { success: false, error: errorMessage };
      }

      // Record successful login
      rateLimitService.recordSuccessfulLogin(cleanEmail);
      console.log('✅ Sign in successful');
      
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
      
      return { success: true };
      
    } catch (error: any) {
      console.error('❌ Unexpected sign in error:', error);
      logAuthFailure(`Unexpected error: ${error.message}`, email);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const cleanEmail = sanitizeInput(email);
      
      if (!validateEmail(cleanEmail)) {
        return { success: false, error: 'Please enter a valid email address' };
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });
      
      if (error) {
        console.error('❌ Password reset error:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Password reset email sent');
      return { success: true };
      
    } catch (error: any) {
      console.error('❌ Unexpected password reset error:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const signOut = async () => {
    try {
      console.log('🔄 Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log('✅ Sign out successful');
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error: any) {
      console.error('❌ Sign out error:', error);
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
