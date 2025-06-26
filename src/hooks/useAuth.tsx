
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

// Hardcoded credentials for demo purposes - now with proper email formats
const DEMO_CREDENTIALS = {
  admin: { email: "admin@sourceedge.dev", password: "sourceedge2025", role: "admin" as const },
  user: { email: "user@sourceedge.dev", password: "user2025", role: "user" as const }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const createProfile = async (userId: string, email: string, role: 'user' | 'admin') => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{ id: userId, email, role }])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Check if this matches demo credentials (support both email and username input)
      let actualEmail = email;
      let actualPassword = password;
      let userRole: 'user' | 'admin' | null = null;

      // Check if user entered username instead of email
      if (email === "sourceedge" && password === "sourceedge2025") {
        actualEmail = DEMO_CREDENTIALS.admin.email;
        actualPassword = DEMO_CREDENTIALS.admin.password;
        userRole = 'admin';
      } else if (email === "sourceuser" && password === "user2025") {
        actualEmail = DEMO_CREDENTIALS.user.email;
        actualPassword = DEMO_CREDENTIALS.user.password;
        userRole = 'user';
      } else if (email === DEMO_CREDENTIALS.admin.email && password === DEMO_CREDENTIALS.admin.password) {
        userRole = 'admin';
      } else if (email === DEMO_CREDENTIALS.user.email && password === DEMO_CREDENTIALS.user.password) {
        userRole = 'user';
      }

      // If it's a demo credential, handle special flow
      if (userRole) {
        // Try to sign in with Supabase first
        const { data, error } = await supabase.auth.signInWithPassword({
          email: actualEmail,
          password: actualPassword,
        });

        if (error) {
          // If user doesn't exist, create them
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: actualEmail,
            password: actualPassword,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                role: userRole
              }
            }
          });

          if (signUpError) {
            console.error('Sign up error:', signUpError);
            return { error: signUpError };
          }

          if (signUpData.user) {
            // Create profile
            await createProfile(signUpData.user.id, actualEmail, userRole);
            
            toast({
              title: `Welcome ${userRole}`,
              description: "Account created and signed in successfully.",
            });
          }

          return { error: null };
        }

        if (data.user) {
          // Make sure profile exists
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (!existingProfile) {
            await createProfile(data.user.id, actualEmail, userRole);
          }

          toast({
            title: `Welcome ${userRole}`,
            description: "Successfully signed in.",
          });
        }

        return { error: null };
      }

      // For non-demo credentials, try regular sign in
      const { error } = await supabase.auth.signInWithPassword({
        email: actualEmail,
        password: actualPassword,
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
