
import { useState, useRef, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Loader2, LogIn, Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { PublicSignupForm } from "@/components/PublicSignupForm";
import { Turnstile } from "@marsidev/react-turnstile";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";

const Auth = () => {
  const { user, signIn, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"signup" | "signin">("signup");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<any>(null);

  // Redirect if already authenticated
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signIn(email, password, captchaToken || undefined);
    setIsLoading(false);
    // Reset captcha after attempt
    if (turnstileRef.current) {
      turnstileRef.current.reset();
      setCaptchaToken(null);
    }
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
              Omiyages! 👋
            </h1>
          </div>
          
          <p className="text-lg text-white/90 leading-relaxed max-w-md">
            Get prepared for your upcoming interviews through our Database 
            of past questions and certified tips. 
          </p>
          
          <div className="absolute bottom-8 left-12 text-white/60 text-sm">
            © 2026 Omiyages. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="text-right mb-8">
            <h2 className="text-2xl font-bold text-foreground">Omiyages</h2>
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

            {TURNSTILE_SITE_KEY && (
              <div className="flex justify-center">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={TURNSTILE_SITE_KEY}
                  onSuccess={(token) => setCaptchaToken(token)}
                  onError={() => setCaptchaToken(null)}
                  onExpire={() => setCaptchaToken(null)}
                />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full py-3 btn-purple-gradient rounded-lg font-semibold" 
              disabled={isLoading || (!!TURNSTILE_SITE_KEY && !captchaToken)}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In Now
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <button 
              type="button"
              onClick={() => { setDialogMode("signup"); setShowDialog(true); }} 
              className="text-primary font-medium hover:underline"
            >
              Register Now
            </button>
          </p>
        </div>
      </div>

      {/* Auth Dialog (Signup / Sign In) */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className={`max-w-md p-0 border-0 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto gap-0 bg-transparent [&>button]:z-10 ${dialogMode === "signup" ? "[&>button]:text-white [&>button]:hover:text-white/80" : "[&>button]:text-gray-400 [&>button]:hover:text-gray-600"}`}>
          <DialogTitle className="sr-only">{dialogMode === "signup" ? "Create Account" : "Sign In"}</DialogTitle>
          {dialogMode === "signup" ? (
            <PublicSignupForm onSwitchToSignIn={() => setDialogMode("signin")} />
          ) : (
            <DialogSignInForm 
              onSwitchToSignUp={() => setDialogMode("signup")} 
              onSuccess={() => setShowDialog(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Sign-in form for use inside the dialog
const DialogSignInForm = ({ onSwitchToSignUp, onSuccess }: { onSwitchToSignUp: () => void; onSuccess: () => void }) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReady, setCaptchaReady] = useState(false);
  const turnstileRef = useRef<any>(null);

  // Delay Turnstile rendering inside dialog
  useEffect(() => {
    const timer = setTimeout(() => setCaptchaReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signIn(email, password, captchaToken || undefined);
    setIsLoading(false);
    // Reset captcha after attempt
    if (turnstileRef.current) {
      turnstileRef.current.reset();
      setCaptchaToken(null);
    }
    onSuccess();
  };

  return (
    <Card className="w-full max-w-md mx-auto rounded-2xl border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-gray-700 to-gray-900 p-8 text-center space-y-2">
        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto">
          <LogIn className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
        <p className="text-white/80 text-sm">
          Sign in to your account
        </p>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 h-11 rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 pr-10 h-11 rounded-lg"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {TURNSTILE_SITE_KEY && captchaReady && (
            <div className="flex justify-center">
              <Turnstile
                ref={turnstileRef}
                siteKey={TURNSTILE_SITE_KEY}
                onSuccess={(token) => setCaptchaToken(token)}
                onError={() => setCaptchaToken(null)}
                onExpire={() => setCaptchaToken(null)}
              />
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isLoading || (!!TURNSTILE_SITE_KEY && !captchaToken)} 
            className="w-full h-11 rounded-lg font-medium text-base"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Protected by Cloudflare Turnstile</span>
          </div>

          <p className="text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <button 
              type="button" 
              onClick={onSwitchToSignUp} 
              className="text-primary font-medium hover:underline"
            >
              Register Now
            </button>
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default Auth;
