
// ABOUTME: Public registration form with Cloudflare Turnstile CAPTCHA, strong password validation,
// ABOUTME: email verification, input sanitization, and admin notification on new signups

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Mail, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, ArrowLeft } from "lucide-react";
import { validatePasswordStrength } from "@/utils/passwordGenerator";
import { Turnstile } from "@marsidev/react-turnstile";
import { Link } from "react-router-dom";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";

interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

interface PublicSignupFormProps {
  onSwitchToSignIn?: () => void;
}

export const PublicSignupForm = ({ onSwitchToSignIn }: PublicSignupFormProps = {}) => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; feedback: string[] }>({ score: 0, feedback: [] });
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReady, setCaptchaReady] = useState(false);
  const turnstileRef = useRef<any>(null);
  const { toast } = useToast();

  // Delay Turnstile rendering to ensure the component is fully mounted
  // (prevents issues when rendered inside a dialog)
  useEffect(() => {
    const timer = setTimeout(() => setCaptchaReady(true), 500);
    return () => clearTimeout(timer);
  }, []);
  
  const form = useForm<SignupFormData>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeTerms: false,
    },
  });

  const watchPassword = form.watch("password");

  const handlePasswordChange = (value: string, onChange: (v: string) => void) => {
    onChange(value);
    if (value) {
      setPasswordStrength(validatePasswordStrength(value));
    } else {
      setPasswordStrength({ score: 0, feedback: [] });
    }
  };

  const getStrengthLabel = (score: number): string => {
    if (score <= 1) return "Weak";
    if (score <= 2) return "Fair";
    if (score <= 3) return "Good";
    if (score <= 4) return "Strong";
    return "Very Strong";
  };

  const getStrengthColor = (score: number): string => {
    if (score <= 1) return "bg-red-500";
    if (score <= 2) return "bg-orange-500";
    if (score <= 3) return "bg-yellow-500";
    if (score <= 4) return "bg-green-500";
    return "bg-emerald-500";
  };

  const sanitizeName = (name: string): string => {
    return name
      .replace(/<[^>]*>/g, '')
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .trim()
      .substring(0, 100);
  };

  const handleSignup = async (data: SignupFormData) => {
    // Validate CAPTCHA
    if (!captchaToken && TURNSTILE_SITE_KEY) {
      toast({
        title: "Verification Required",
        description: "Please complete the CAPTCHA verification.",
        variant: "destructive",
      });
      return;
    }

    // Validate password match
    if (data.password !== data.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    // Validate password strength (minimum score 4)
    const strength = validatePasswordStrength(data.password);
    if (strength.score < 4) {
      toast({
        title: "Weak Password",
        description: "Please use a stronger password with uppercase, lowercase, numbers, and special characters.",
        variant: "destructive",
      });
      return;
    }

    // Validate terms agreement
    if (!data.agreeTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const sanitizedName = sanitizeName(data.fullName);
      const sanitizedEmail = data.email.toLowerCase().trim();

      // Sign up with Supabase (includes CAPTCHA token for server-side verification)
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: data.password,
        options: {
          captchaToken: captchaToken || undefined,
          data: {
            full_name: sanitizedName,
          },
        },
      });

      if (signupError) {
        throw signupError;
      }

      if (authData.user) {
        // Create profile with is_active = false (requires admin approval)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: authData.user.email,
            full_name: sanitizedName,
            role: 'user' as const,
            is_active: false,
          });

        if (profileError) {
          // Silently handle profile creation error
        }

        // Send admin notification email (non-blocking)
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              type: 'admin_new_registration',
              data: {
                fullName: sanitizedName,
                email: sanitizedEmail,
              },
            },
          });
        } catch (emailError) {
          // Silently handle non-blocking admin notification email error
        }
      }

      setSubmitted(true);
      form.reset();
      
    } catch (error: any) {
      let userMessage = 'An error occurred during registration';
      if (error?.message?.includes('already_registered')) {
        userMessage = 'An account with this email already exists';
      } else if (error?.message) {
        userMessage = error.message;
      }
      
      toast({
        title: "Registration Failed",
        description: userMessage,
        variant: "destructive",
      });

      // Reset CAPTCHA on failure
      if (turnstileRef.current) {
        turnstileRef.current.reset();
        setCaptchaToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-md mx-auto rounded-2xl border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-primary/80 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Registration Submitted!</h2>
        </div>
        <CardContent className="p-8 text-center space-y-4">
          <div className="bg-blue-50 rounded-xl p-4 text-left">
            <p className="text-sm font-medium text-blue-900 mb-2">What happens next?</p>
            <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
              <li>Check your email to verify your account</li>
              <li>An admin will review and approve your registration</li>
              <li>You'll receive an email once your account is activated</li>
            </ol>
          </div>
          <p className="text-sm text-gray-500">
            Didn't receive the verification email? Check your spam folder.
          </p>
          <Link to="/auth">
            <Button variant="outline" className="w-full mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto rounded-2xl border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-primary to-primary/80 p-8 text-center space-y-2">
        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto">
          <UserPlus className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Create an Account</h2>
        <p className="text-white/80 text-sm">
          Register to start your interview preparation
        </p>
      </CardHeader>
      <CardContent className="p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSignup)} className="space-y-5">
            {/* Full Name */}
            <FormField
              control={form.control}
              name="fullName"
              rules={{ 
                required: "Full name is required",
                minLength: { value: 2, message: "Name must be at least 2 characters" },
                maxLength: { value: 100, message: "Name must be under 100 characters" },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Full Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        placeholder="Enter your full name" 
                        className="pl-10 h-11 rounded-lg border-gray-200 focus:border-primary"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              rules={{ 
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Please enter a valid email address"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        type="email" 
                        placeholder="you@example.com" 
                        className="pl-10 h-11 rounded-lg border-gray-200 focus:border-primary"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              rules={{ 
                required: "Password is required",
                minLength: { value: 8, message: "Password must be at least 8 characters" },
                validate: (value) => {
                  const hasUpper = /[A-Z]/.test(value);
                  const hasLower = /[a-z]/.test(value);
                  const hasNumber = /[0-9]/.test(value);
                  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
                  if (!hasUpper) return "Must include an uppercase letter";
                  if (!hasLower) return "Must include a lowercase letter";
                  if (!hasNumber) return "Must include a number";
                  if (!hasSpecial) return "Must include a special character";
                  return true;
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Create a strong password" 
                        className="pl-10 pr-10 h-11 rounded-lg border-gray-200 focus:border-primary"
                        {...field}
                        onChange={(e) => handlePasswordChange(e.target.value, field.onChange)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  {/* Password Strength Meter */}
                  {watchPassword && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength.score)}`}
                            style={{ width: `${Math.max(10, (passwordStrength.score / 6) * 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          passwordStrength.score <= 2 ? 'text-red-600' : 
                          passwordStrength.score <= 3 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {getStrengthLabel(passwordStrength.score)}
                        </span>
                      </div>
                      {passwordStrength.feedback.length > 0 && (
                        <ul className="text-xs text-gray-500 space-y-0.5">
                          {passwordStrength.feedback.map((fb, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <span className="w-1 h-1 bg-gray-400 rounded-full" />
                              {fb}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password */}
            <FormField
              control={form.control}
              name="confirmPassword"
              rules={{ 
                required: "Please confirm your password",
                validate: (value) => 
                  value === form.getValues('password') || "Passwords do not match"
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        type={showConfirmPassword ? "text" : "password"} 
                        placeholder="Confirm your password" 
                        className="pl-10 pr-10 h-11 rounded-lg border-gray-200 focus:border-primary"
                        {...field} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Terms and Conditions */}
            <FormField
              control={form.control}
              name="agreeTerms"
              rules={{ validate: (value) => value === true || "You must agree to the terms" }}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-start gap-3">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                        className="mt-0.5"
                      />
                    </FormControl>
                    <label className="text-sm text-gray-600 leading-snug cursor-pointer" onClick={() => field.onChange(!field.value)}>
                      I agree to the Terms of Service and Privacy Policy
                    </label>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cloudflare Turnstile CAPTCHA */}
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
            
            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={loading || (!!TURNSTILE_SITE_KEY && !captchaToken)} 
              className="w-full h-11 rounded-lg font-medium text-base"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Protected by Cloudflare Turnstile</span>
            </div>

            {/* Sign In Link */}
            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              {onSwitchToSignIn ? (
                <button 
                  type="button" 
                  onClick={onSwitchToSignIn} 
                  className="text-primary font-medium hover:underline"
                >
                  Sign in
                </button>
              ) : (
                <Link to="/auth" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              )}
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
