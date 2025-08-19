
// ABOUTME: Secure user creation form with enhanced validation and proper API usage
// ABOUTME: Uses secure edge function without hardcoded credentials

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, User, Mail, Shield, AlertTriangle } from "lucide-react";
import { validateEmail, validateAndSanitizeInput } from "@/utils/secureInputValidation";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const CreateUserForm = () => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createUserMutation = useMutation({
    mutationFn: async (userData: { email: string; fullName: string; role: string }) => {
      // Clear previous errors
      setValidationErrors([]);

      // Validate inputs
      const emailValid = validateEmail(userData.email);
      const nameValidation = validateAndSanitizeInput(userData.fullName, 100, user?.id);
      const roleValidation = validateAndSanitizeInput(userData.role, 10, user?.id);

      const allErrors = [];
      if (!emailValid) allErrors.push('Please enter a valid email address');
      if (!nameValidation.isValid) allErrors.push(...nameValidation.errors);
      if (!roleValidation.isValid) allErrors.push(...roleValidation.errors);

      if (allErrors.length > 0) {
        setValidationErrors(allErrors);
        throw new Error('Validation failed');
      }

      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No active session found');
      }

      // Call secure edge function
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          email: userData.email.toLowerCase().trim(),
          fullName: nameValidation.sanitizedValue,
          role: roleValidation.sanitizedValue
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Store the generated password to show to admin
      if (data?.temporaryPassword) {
        setGeneratedPassword(data.temporaryPassword);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      
      toast({
        title: "User Created Successfully",
        description: `User ${data.user?.email} has been created with enhanced security.`,
      });

      // Reset form
      setEmail("");
      setFullName("");
      setRole("user");
    },
    onError: (error: any) => {
      console.error('User creation error:', error);
      
      if (error.message === 'Validation failed') {
        // Validation errors are already set in state
        return;
      }

      toast({
        title: "Error Creating User",
        description: error.message || "Failed to create user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !fullName.trim()) {
      setValidationErrors(['Email and full name are required']);
      return;
    }

    createUserMutation.mutate({
      email: email.trim(),
      fullName: fullName.trim(),
      role
    });
  };

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast({
      title: "Password Copied",
      description: "Temporary password has been copied to clipboard.",
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Create User Account
        </CardTitle>
        <CardDescription>
          Create a new user account with secure password generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              disabled={createUserMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name *
            </Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              required
              disabled={createUserMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">User Role</Label>
            <Select value={role} onValueChange={setRole} disabled={createUserMutation.isPending}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={createUserMutation.isPending}
          >
            {createUserMutation.isPending ? "Creating User..." : "Create User"}
          </Button>
        </form>

        {generatedPassword && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="font-semibold text-yellow-800 mb-2">
              Temporary Password Generated
            </h4>
            <div className="flex items-center gap-2">
              <Input
                type={showPassword ? "text" : "password"}
                value={generatedPassword}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyPasswordToClipboard}
              >
                Copy
              </Button>
            </div>
            <p className="text-xs text-yellow-700 mt-2">
              Please share this password securely with the user. They should change it on first login.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
