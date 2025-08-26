
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Set a maximum timeout for auth initialization
    const authTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⚠️ Auth initialization timeout - proceeding without session');
        setLoading(false);
        setUser(null);
      }
    }, 10000); // 10 second timeout

    // Get initial session with enhanced error handling
    const getInitialSession = async () => {
      try {
        console.log('🔄 Getting initial session...');
        console.log('🔍 Supabase client initialized:', !!supabase);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) {
          console.log('🚫 Component unmounted during auth check');
          return;
        }
        
        if (error) {
          console.error('❌ Error getting session:', error);
          console.error('Error details:', {
            message: error.message,
            status: error.status,
            name: error.name
          });
          setUser(null);
        } else {
          console.log('✅ Initial session result:', {
            hasSession: !!session,
            userId: session?.user?.id,
            userEmail: session?.user?.email,
            expiresAt: session?.expires_at
          });
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('❌ Unexpected error getting session:', error);
        console.error('Error type:', typeof error);
        console.error('Error constructor:', error?.constructor?.name);
        if (mounted) setUser(null);
      } finally {
        if (mounted) {
          clearTimeout(authTimeout);
          setLoading(false);
          console.log('✅ Auth initialization complete');
        }
      }
    };

    // Add a small delay to ensure DOM is ready
    timeoutId = setTimeout(() => {
      getInitialSession();
    }, 100);

    // Listen for auth changes with enhanced logging
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) {
          console.log('🚫 Auth state change ignored - component unmounted');
          return;
        }
        
        console.log('🔄 Auth state changed:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email
        });
        
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(authTimeout);
      clearTimeout(timeoutId);
      subscription.unsubscribe();
      console.log('🧹 Auth context cleanup complete');
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔄 Signing in:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log('✅ Sign in successful');
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      
      // Handle the case where there's no session to sign out from
      if (error.name === 'AuthSessionMissingError') {
        console.log('✅ No active session - treating as successful sign out');
        setUser(null);
        toast({
          title: "Signed out",
          description: "You have been signed out successfully.",
        });
      } else {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
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
