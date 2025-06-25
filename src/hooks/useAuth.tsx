
import { useState, useEffect, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: Profile | null;
  profile: Profile | null;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded credentials
const CREDENTIALS = {
  admin: { email: "sourceedge", password: "sourceedge2025", role: "admin" as const },
  user: { email: "sourceuser", password: "user2025", role: "user" as const }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Check admin credentials
    if (email === CREDENTIALS.admin.email && password === CREDENTIALS.admin.password) {
      const adminUser: Profile = {
        id: "admin-1",
        email: CREDENTIALS.admin.email,
        role: CREDENTIALS.admin.role
      };
      setUser(adminUser);
      localStorage.setItem('currentUser', JSON.stringify(adminUser));
      toast({
        title: "Welcome Admin",
        description: "Successfully signed in as administrator.",
      });
      return { error: null };
    }
    
    // Check user credentials
    if (email === CREDENTIALS.user.email && password === CREDENTIALS.user.password) {
      const normalUser: Profile = {
        id: "user-1",
        email: CREDENTIALS.user.email,
        role: CREDENTIALS.user.role
      };
      setUser(normalUser);
      localStorage.setItem('currentUser', JSON.stringify(normalUser));
      toast({
        title: "Welcome User",
        description: "Successfully signed in.",
      });
      return { error: null };
    }

    // Invalid credentials
    const error = { message: "Invalid email or password" };
    toast({
      title: "Sign In Failed",
      description: error.message,
      variant: "destructive",
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const error = { message: "Sign up is not available. Please use the provided credentials." };
    toast({
      title: "Sign Up Not Available",
      description: error.message,
      variant: "destructive",
    });
    return { error };
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    // Navigate to login page after logout
    window.location.href = '/auth';
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: user,
        session: user ? { user } : null,
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
