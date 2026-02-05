
import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const PublicSignupForm = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<SignupFormData>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSignup = async (data: SignupFormData) => {
    if (data.password !== data.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Sign up the user
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: data.email.toLowerCase().trim(),
        password: data.password,
        options: {
          data: {
            full_name: data.fullName.trim(),
          }
        }
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
            full_name: data.fullName.trim(),
            role: 'user' as const,
            is_active: false, // Requires admin approval
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }

      setSubmitted(true);
      toast({
        title: "Registration Submitted!",
        description: "Your account has been created and is pending admin approval. You'll be notified once approved.",
      });

      form.reset();
      
    } catch (error: any) {
      console.error('Signup error:', error);
      
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
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-green-600">Registration Submitted!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-4">
            Your account has been created and is pending admin approval. 
            You'll receive an email notification once your account is approved.
          </p>
          <Button 
            variant="outline" 
            onClick={() => setSubmitted(false)}
            className="w-full"
          >
            Submit Another Registration
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <UserPlus className="w-5 h-5" />
          Register New Account
        </CardTitle>
        <p className="text-sm text-gray-600">
          Submit a registration request for admin approval
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSignup)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              rules={{ required: "Full name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              rules={{ 
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter your email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              rules={{ 
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Confirm password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Submitting..." : "Submit Registration"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
