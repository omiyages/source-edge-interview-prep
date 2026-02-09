
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { PublicSignupForm } from "@/components/PublicSignupForm";

const Auth = () => {
  const { user, signIn, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  // Redirect if already authenticated
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signIn(email, password);
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Darker Purple Gradient with Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-800 to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/60" />
        
        {/* Geometric Background Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 border border-white/20 rounded-lg rotate-12 transform"></div>
        <div className="absolute top-40 left-40 w-24 h-24 border border-white/15 rounded-lg rotate-45 transform"></div>
        <div className="absolute top-60 left-32 w-16 h-16 border border-white/10 rounded-lg -rotate-12 transform"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          <div className="mb-8">
            <div className="w-12 h-12 mb-6">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Welcome to<br />
              Source Edge Database! 👋
            </h1>
          </div>
          
          <p className="text-lg text-white/90 leading-relaxed max-w-md">
            Get prepared for your upcoming interviews through our Database 
            of past questions and certified tips. 
          </p>
          
          <div className="absolute bottom-8 left-12 text-white/60 text-sm">
            © 2025 Source Edge. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="text-right mb-8">
            <h2 className="text-2xl font-bold text-foreground">Source Edge</h2>
          </div>
          
          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-foreground mb-2">Welcome Back!</h3>
            <p className="text-muted-foreground">
              Enter your credentials to access interview questions
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-1">
              <Input
                id="email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-0 border-b border-border bg-transparent rounded-none px-0 py-3 focus:ring-0 focus:border-primary placeholder:text-muted-foreground"
              />
            </div>
            
            <div className="space-y-1">
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-0 border-b border-border bg-transparent rounded-none px-0 py-3 focus:ring-0 focus:border-primary placeholder:text-muted-foreground"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full py-3 btn-purple-gradient rounded-lg font-semibold" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login Now
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <button 
              type="button"
              onClick={() => setShowSignup(true)} 
              className="text-primary font-medium hover:underline"
            >
              Register Now
            </button>
          </p>
        </div>
      </div>

      {/* Signup Dialog */}
      <Dialog open={showSignup} onOpenChange={setShowSignup}>
        <DialogContent className="max-w-md p-0 border-0 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          <PublicSignupForm />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
