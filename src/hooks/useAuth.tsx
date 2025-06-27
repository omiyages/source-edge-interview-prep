import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { loadOrCreateProfile, validateEmail, validatePassword } from "@/services/secureAuthService";
import type { User, Session } from '@supabase/supabase-js';
import type { AuthContextType, Profile } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const { toast } = useToast();

  const startSession = useCallback(async (userId: string) => {
    try {
      console.log('🔄 Starting session for user:', userId);
      const { data, error } = await supabase
        .from('user_sessions')
        .insert([{ user_id: userId }])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error starting session:', error);
        return;
      }
      
      setSessionId(data.id);
      setSessionStartTime(new Date());
      console.log('✅ Session started:', data.id);
    } catch (error) {
      console.error('❌ Unexpected error starting session:', error);
    }
  }, []);

  const endSession = useCallback(async () => {
    if (sessionId && sessionStartTime) {
      try {
        console.log('🔄 Ending session:', sessionId);
        const endTime = new Date();
        const durationMinutes = Math.round((endTime.getTime() - sessionStartTime.getTime()) / (1000 * 60));
        
        await supabase
          .from('user_sessions')
          .update({
            ended_at: endTime.toISOString(),
            duration_minutes: durationMinutes
          })
          .eq('id', sessionId);

        if (user) {
          const { data: currentProfile } = await supabase
            .from('profiles')
            .select('total_session_time_minutes')
            .eq('id', user.id)
            .single();

          const currentTotal = currentProfile?.total_session_time_minutes || 0;
          await supabase
            .from('profiles')
            .update({
              total_session_time_minutes: currentTotal + durationMinutes
            })
            .eq('id', user.id);
        }
        
        console.log('✅ Session ended successfully');
      } catch (error) {
        console.error('❌ Error ending session:', error);
      }
    }
    setSessionId(null);
    setSessionStartTime(null);
  }, [sessionId, sessionStartTime, user]);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing auth...');
        
        // Set a reasonable timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.log('⏰ Auth initialization timeout - setting loading to false');
            setLoading(false);
          }
        }, 3000); // Reduced from 5000 to 3000ms

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting initial session:', error);
          if (mounted) {
            clearTimeout(timeoutId);
            setLoading(false);
          }
          return;
        }

        console.log('📋 Initial session:', session?.user?.email || 'No session');

        if (mounted) {
          clearTimeout(timeoutId);
          
          if (session?.user) {
            console.log('👤 Setting user and loading profile...');
            setUser(session.user);
            setSession(session);
            
            try {
              const userProfile = await loadOrCreateProfile(session.user);
              console.log('📋 Profile loaded:', userProfile?.role);
              setProfile(userProfile);
              
              // Start session for new logins
              await startSession(session.user.id);
            } catch (profileError) {
              console.error('❌ Error loading profile:', profileError);
              setProfile(null);
            }
          } else {
            console.log('🚪 No active session');
            setUser(null);
            setSession(null);
            setProfile(null);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error in auth initialization:', error);
        if (mounted) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event);
        
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          setSession(session);
          
          if (event === 'SIGNED_IN') {
            try {
              const userProfile = await loadOrCreateProfile(session.user);
              setProfile(userProfile);
              await startSession(session.user.id);
            } catch (error) {
              console.error('❌ Error handling sign in:', error);
              setProfile(null);
            }
          }
        } else {
          setUser(null);
          setSession(null);
          setProfile(null);
          
          if (event === 'SIGNED_OUT') {
            await endSession();
          }
        }
        
        setLoading(false);
      }
    );

    // Initialize auth
    initializeAuth();

    const handleBeforeUnload = () => {
      endSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      endSession();
    };
  }, [startSession, endSession]);

  const signIn = async (email: string, password: string) => {
    try {
      if (!validateEmail(email)) {
        const errorMessage = "Please enter a valid email address";
        toast({
          title: "Invalid Input",
          description: errorMessage,
          variant: "destructive",
        });
        return { error: { message: errorMessage } };
      }

      console.log('🔐 Sign in attempt with:', email);
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        setLoading(false);
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });
      return { error: null };
    } catch (error) {
      console.error('❌ Unexpected sign in error:', error);
      setLoading(false);
      const errorMessage = { message: "An unexpected error occurred" };
      toast({
        title: "Sign In Failed",
        description: errorMessage.message,
        variant: "destructive",
      });
      return { error: errorMessage };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      if (!validateEmail(email)) {
        const errorMessage = "Please enter a valid email address";
        toast({
          title: "Invalid Input",
          description: errorMessage,
          variant: "destructive",
        });
        return { error: { message: errorMessage } };
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        toast({
          title: "Invalid Password",
          description: passwordValidation.message,
          variant: "destructive",
        });
        return { error: { message: passwordValidation.message } };
      }

      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link.",
      });

      return { error: null };
    } catch (error) {
      console.error('Unexpected sign up error:', error);
      const errorMessage = { message: "An unexpected error occurred" };
      toast({
        title: "Sign Up Failed",
        description: errorMessage.message,
        variant: "destructive",
      });
      return { error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      await endSession();
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      
      setUser(null);
      setSession(null);
      setProfile(null);
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      
      window.location.href = '/auth';
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign Out Error",
        description: "There was an issue signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isAdmin = profile?.role === 'admin';
  
  console.log('🎯 Current auth state:', {
    userEmail: user?.email,
    profileRole: profile?.role,
    isAdmin,
    loading
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
