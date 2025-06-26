
import { useState, useEffect, createContext, useContext } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { loadOrCreateProfile, mapCredentials, isDemoUser, getDemoUser } from "@/services/authService";
import type { User, Session } from '@supabase/supabase-js';
import type { AuthContextType, Profile } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
        }, 0);
      } else {
        setProfile(null);
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
          }
        });
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (emailOrUsername: string, password: string) => {
    try {
      const { email, password: mappedPassword } = mapCredentials(emailOrUsername, password);

      // Check if this is a demo user that might not exist yet
      if (isDemoUser(email)) {
        const demoUser = getDemoUser(email);
        if (password === demoUser.password) {
          // Try to sign in first
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error && error.message.includes('Invalid login credentials')) {
            // User doesn't exist, create them
            const { error: signUpError } = await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: `${window.location.origin}/`,
                data: {
                  role: demoUser.role
                }
              }
            });

            if (signUpError) {
              console.error('Sign up error:', signUpError);
              toast({
                title: "Sign Up Failed",
                description: signUpError.message,
                variant: "destructive",
              });
              return { error: signUpError };
            }

            toast({
              title: `Welcome ${demoUser.role}!`,
              description: "Demo account created and signed in successfully.",
            });
            return { error: null };
          }

          if (error) {
            toast({
              title: "Sign In Failed",
              description: error.message,
              variant: "destructive",
            });
            return { error };
          }

          toast({
            title: `Welcome back!`,
            description: "Successfully signed in.",
          });
          return { error: null };
        }
      }

      // Regular sign in for non-demo users
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: mappedPassword,
      });

      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

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
