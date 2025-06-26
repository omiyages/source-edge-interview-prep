
import { useState, useEffect, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo credentials with valid email formats
const DEMO_USERS = {
  'admin@example.com': { password: 'sourceedge2025', role: 'admin' as const },
  'user@example.com': { password: 'user2025', role: 'user' as const }
};

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
          await loadOrCreateProfile(session.user);
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
        loadOrCreateProfile(session.user);
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadOrCreateProfile = async (user: User) => {
    try {
      // First try to get existing profile
      const { data: existingProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        setProfile(existingProfile);
        return;
      }

      // If no profile exists, create one
      if (error?.code === 'PGRST116') {
        // Determine role based on email
        const email = user.email || '';
        let role: 'user' | 'admin' = 'user';
        
        if (email === 'admin@example.com') {
          role = 'admin';
        }

        const { data: newProfile } = await supabase
          .from('profiles')
          .insert([{ 
            id: user.id, 
            email: email,
            role: role 
          }])
          .select()
          .single();

        if (newProfile) {
          setProfile(newProfile);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const signIn = async (emailOrUsername: string, password: string) => {
    try {
      // Handle demo credentials with username mapping
      let email = emailOrUsername;
      let actualPassword = password;

      // Map usernames to emails for demo
      if (emailOrUsername === 'sourceedge' && password === 'sourceedge2025') {
        email = 'admin@example.com';
      } else if (emailOrUsername === 'sourceuser' && password === 'user2025') {
        email = 'user@example.com';
      }

      // Check if this is a demo user that might not exist yet
      const isDemoUser = email in DEMO_USERS;
      
      if (isDemoUser) {
        const demoUser = DEMO_USERS[email as keyof typeof DEMO_USERS];
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
