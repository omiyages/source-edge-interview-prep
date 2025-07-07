
import { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle, Clock } from "lucide-react";

const Auth = () => {
  const { user, signIn, resetPassword, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [lockoutTime, setLockoutTime] = useState(0);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState("");

  // Handle password reset confirmation
  useEffect(() => {
    if (searchParams.get('reset') === 'true') {
      setResetSuccess(true);
    }
  }, [searchParams]);

  // Countdown timer for lockout
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (lockoutTime > 0) {
      interval = setInterval(() => {
        setLockoutTime(prev => {
          if (prev <= 1) {
            setError("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutTime]);

  // Redirect if already authenticated
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    const result = await signIn(email, password);
    
    if (!result.success) {
      setError(result.error || "Login failed");
      if (result.isRateLimited && result.lockedUntil) {
        const remainingSeconds = Math.ceil((result.lockedUntil - Date.now()) / 1000);
        setLockoutTime(remainingSeconds);
      }
    }
    
    setIsLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    
    if (!email) {
      setResetError("Please enter your email address");
      return;
    }
    
    const result = await resetPassword(email);
    
    if (result.success) {
      setResetSuccess(true);
      setShowResetForm(false);
    } else {
      setResetError(result.error || "Failed to send reset email");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {showResetForm ? "Reset Password" : "Login"}
          </CardTitle>
          <p className="text-gray-600">
            {showResetForm 
              ? "Enter your email to receive a password reset link"
              : "Enter your credentials to access interview questions"
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Success Messages */}
          {resetSuccess && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Password reset email sent! Check your inbox and follow the instructions.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {resetError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{resetError}</AlertDescription>
            </Alert>
          )}

          {/* Lockout Timer */}
          {lockoutTime > 0 && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Account locked. Try again in {lockoutTime} seconds.
              </AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          {!showResetForm ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={lockoutTime > 0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={lockoutTime > 0}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || lockoutTime > 0}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
              
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setShowResetForm(true)}
                  className="text-sm"
                >
                  Forgot your password?
                </Button>
              </div>
            </form>
          ) : (
            /* Password Reset Form */
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
              
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setShowResetForm(false);
                    setResetError("");
                  }}
                  className="text-sm"
                >
                  Back to Login
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
