
import { useState, useEffect, createContext, useContext } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { loadOrCreateProfile } from "@/services/authService";
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

  // Track user session
  const startSession = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .insert([{ user_id: userId }])
        .select()
        .single();
      
      if (error) throw error;
      
      setSessionId(data.id);
      setSessionStartTime(new Date());
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const endSession = async () => {
    if (sessionId && sessionStartTime) {
      try {
        const endTime = new Date();
        const durationMinutes = Math.round((endTime.getTime() - sessionStartTime.getTime()) / (1000 * 60));
        
        await supabase
          .from('user_sessions')
          .update({
            ended_at: endTime.toISOString(),
            duration_minutes: durationMinutes
          })
          .eq('id', sessionId);

        // Update total session time in profile
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
      } catch (error) {
        console.error('Error ending session:', error);
      }
    }
    setSessionId(null);
    setSessionStartTime(null);
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Load or create profile
        setTimeout(async () => {
          if (!mounted) return;
          const userProfile = await loadOrCreateProfile(session.user);
          setProfile(userProfile);
          
          // Start session tracking
          if (event === 'SIGNED_IN') {
            await startSession(session.user.id);
          }
        }, 0);
      } else {
        setProfile(null);
        // End session tracking
        if (event === 'SIGNED_OUT') {
          await endSession();
        }
      }
      
      setLoading(false);
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadOrCreateProfile(session.user).then(userProfile => {
          if (mounted) {
            setProfile(userProfile);
            // Start session for existing users
            startSession(session.user.id);
          }
        });
      }
      
      setLoading(false);
    });

    // End session when user closes the browser
    const handleBeforeUnload = () => {
      endSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      endSession();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Sign in attempt with:', email);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
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
      console.error('Sign in error:', error);
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });

      if (error) {
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
      console.error('Sign up error:', error);
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
    // End session before signing out
    await endSession();
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
    }
    
    setUser(null);
    setSession(null);
    setProfile(null);
    
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    
    window.location.href = '/auth';
  };

  const isAdmin = profile?.role === 'admin';

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
