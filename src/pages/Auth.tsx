
import { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle, Clock } from "lucide-react";

const Auth = () => {
  const { user, signIn, resetPassword, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [lockoutTime, setLockoutTime] = useState(0);
  const [showResetForm, setShowResetForm] = useState(false);
  const [showNewPasswordForm, setShowNewPasswordForm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState("");

  // Handle password reset flow
  useEffect(() => {
    const handleAuthCallback = async () => {
      // Check if this is a password reset callback
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const type = searchParams.get('type');
      
      if (type === 'recovery' && accessToken && refreshToken) {
        try {
          // Set the session with the tokens from URL
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) {
            console.error('Error setting session:', error);
            setError('Invalid or expired reset link. Please request a new one.');
            return;
          }
          
          // Clear URL parameters and show password reset form
          setSearchParams({});
          setShowNewPasswordForm(true);
          setError('');
          
        } catch (error) {
          console.error('Password reset callback error:', error);
          setError('An error occurred processing the reset link.');
        }
      } else if (searchParams.get('reset') === 'true') {
        setResetSuccess(true);
      }
      
      // Handle error parameters from failed reset attempts
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      if (errorParam && errorDescription) {
        if (errorParam === 'access_denied' && errorDescription.includes('expired')) {
          setError('The password reset link has expired. Please request a new one.');
          setSearchParams({});
        }
      }
    };
    
    handleAuthCallback();
  }, [searchParams, setSearchParams]);

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
    setIsLoading(true);
    
    if (!email) {
      setResetError("Please enter your email address");
      setIsLoading(false);
      return;
    }
    
    const result = await resetPassword(email);
    
    if (result.success) {
      setResetSuccess(true);
      setShowResetForm(false);
    } else {
      setResetError(result.error || "Failed to send reset email");
    }
    setIsLoading(false);
  };

  const handleNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }
    
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        setError(error.message);
      } else {
        setResetSuccess(true);
        setShowNewPasswordForm(false);
        setError('');
        // Clear form
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      setError('An unexpected error occurred. Please try again.');
    }
    
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {showNewPasswordForm ? "Set New Password" : showResetForm ? "Reset Password" : "Login"}
          </CardTitle>
          <p className="text-gray-600">
            {showNewPasswordForm 
              ? "Enter your new password"
              : showResetForm 
                ? "Enter your email to receive a password reset link"
                : "Enter your credentials to access interview questions"
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Success Messages */}
          {resetSuccess && !showNewPasswordForm && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {showResetForm || resetSuccess 
                  ? "Password reset email sent! Check your inbox and follow the instructions."
                  : "Password updated successfully! You can now sign in with your new password."
                }
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

          {/* New Password Form */}
          {showNewPasswordForm ? (
            <form onSubmit={handleNewPasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          ) : 
          /* Login Form */
          !showResetForm ? (
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
