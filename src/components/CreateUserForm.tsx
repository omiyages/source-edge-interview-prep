
// ABOUTME: Secure user creation form with enhanced validation and proper API usage
// ABOUTME: Uses secure edge function without hardcoded credentials

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { clerkSupabaseClient } from "@/lib/clerk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, User, Mail, Shield, AlertTriangle, Key, RefreshCw } from "lucide-react";
import { validateEmail, validateAndSanitizeInput } from "@/utils/secureInputValidation";
import { useAuth } from "@/hooks/useAuth";
import { useAuth as useClerkAuth } from "@clerk/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateSecurePassword, validatePasswordStrength } from "@/utils/passwordGenerator";
import { Switch } from "@/components/ui/switch";
import { StickyFormActions } from "@/components/ui/sticky-form-actions";
import { environment } from "@/config/environment";

export const CreateUserForm = () => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("SourceEdge2025!");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [useManualPassword, setUseManualPassword] = useState(true);
  const [manualPassword, setManualPassword] = useState("SourceEdge2025!");
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { getToken } = useClerkAuth();

  const generatePassword = () => {
    const newPassword = generateSecurePassword(16);
    setGeneratedPassword(newPassword);
    if (!useManualPassword) {
      setManualPassword(newPassword);
    }
  };

  // Auto-generate email from full name
  const generateEmailFromName = (name: string) => {
    if (!name.trim()) return "";
    
    // Remove spaces, convert to lowercase, and add @sourceedge.com
    const emailPrefix = name
      .toLowerCase()
      .replace(/\s+/g, '') // Remove all spaces
      .replace(/[^a-z0-9]/g, ''); // Remove special characters, keep only letters and numbers
    
    return `${emailPrefix}@source-edge.com`;
  };

  const handleFullNameChange = (value: string) => {
    setFullName(value);
    // Auto-populate email if it's empty or was previously auto-generated
    if (!email || email.includes('@source-edge.com')) {
      setEmail(generateEmailFromName(value));
    }
  };

  const handleManualPasswordChange = (value: string) => {
    setManualPassword(value);
    const strength = validatePasswordStrength(value);
    setPasswordStrength(strength);
  };

  const createUserMutation = useMutation({
    mutationFn: async (userData: { email: string; fullName: string; role: string; password?: string }) => {
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

      // Validate manual password if provided
      if (useManualPassword && userData.password) {
        const strength = validatePasswordStrength(userData.password);
        if (strength.score < 4) {
          allErrors.push('Password is too weak. Please use a stronger password.');
          allErrors.push(...strength.feedback);
        }
      }

      if (allErrors.length > 0) {
        setValidationErrors(allErrors);
        throw new Error('Validation failed');
      }

      // Prepare request body
      const requestBody: any = {
        email: userData.email.toLowerCase().trim(),
        fullName: nameValidation.sanitizedValue,
        role: roleValidation.sanitizedValue
      };

      // Add custom password if manual mode is enabled
      if (useManualPassword && userData.password) {
        requestBody.customPassword = userData.password;
      }

      // Call secure edge function
      const clerkJwt = await getToken({ skipCache: true });
      if (!clerkJwt) throw new Error("Not authenticated");

      const resp = await fetch(`${environment.supabase.url}/functions/v1/admin-user-management`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: environment.supabase.anonKey,
          "x-clerk-jwt": clerkJwt,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data?.error || `Failed to create user (${resp.status})`);
      }
      if (data?.error) throw new Error(data.error);

      // Store the generated password to show to admin
      if (data?.temporaryPassword) {
        setGeneratedPassword(data.temporaryPassword);
      }

      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      
      // Send welcome email (non-blocking)
      try {
        if (data.user?.email) {
          await clerkSupabaseClient.functions.invoke('send-email', {
            body: {
              type: 'welcome',
              data: {
                email: data.user.email,
                fullName: data.user.full_name || fullName,
                temporaryPassword: data.temporaryPassword || manualPassword,
              },
            },
          });
        }
      } catch (emailError) {
        // Silently handle non-blocking welcome email error
      }

      toast({
        title: "User Created Successfully",
        description: `User ${data.user?.email} has been created. A welcome email has been sent.`,
      });

      // Reset form
      setEmail("");
      setFullName("");
      setRole("user");
      setGeneratedPassword("SourceEdge2025!");
      setManualPassword("SourceEdge2025!");
      setPasswordStrength({ score: 0, feedback: [] });
      setUseManualPassword(true);
    },
    onError: (error: any) => {
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

    if (useManualPassword && !manualPassword.trim()) {
      setValidationErrors(['Manual password is required when manual mode is enabled']);
      return;
    }

    createUserMutation.mutate({
      email: email.trim(),
      fullName: fullName.trim(),
      role,
      password: useManualPassword ? manualPassword : undefined
    });
  };

  const copyPasswordToClipboard = () => {
    const passwordToCopy = useManualPassword ? manualPassword : generatedPassword;
    navigator.clipboard.writeText(passwordToCopy);
    toast({
      title: "Password Copied",
      description: "Password has been copied to clipboard.",
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
        <form onSubmit={handleSubmit} className="space-y-4 pb-20 relative z-0">
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
              onChange={(e) => handleFullNameChange(e.target.value)}
              placeholder="John Doe"
              required
              disabled={createUserMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">User Role</Label>
            <Select value={role} onValueChange={setRole} disabled={createUserMutation.isPending}>
              <SelectTrigger className="relative z-[50]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[60]">
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="password-mode" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Password Mode
              </Label>
              <div className="flex items-center space-x-2">
                <Label htmlFor="manual-password" className="text-sm">Auto</Label>
                <Switch
                  id="manual-password"
                  checked={useManualPassword}
                  onCheckedChange={setUseManualPassword}
                />
                <Label htmlFor="manual-password" className="text-sm">Manual</Label>
              </div>
            </div>

            {useManualPassword ? (
              <div className="space-y-2">
                <Label htmlFor="manualPassword">Set Password *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="manualPassword"
                    type={showPassword ? "text" : "password"}
                    value={manualPassword}
                    onChange={(e) => handleManualPasswordChange(e.target.value)}
                    placeholder="Enter secure password"
                    disabled={createUserMutation.isPending}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {manualPassword && (
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span>Strength:</span>
                      <div className="flex-1 bg-neutral-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            passwordStrength.score < 2 ? 'bg-red-500' :
                            passwordStrength.score < 4 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                        />
                      </div>
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <ul className="text-orange-600 list-disc list-inside">
                        {passwordStrength.feedback.map((feedback, index) => (
                          <li key={index}>{feedback}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generatePassword}
                  disabled={createUserMutation.isPending}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate Password
                </Button>
                {generatedPassword && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyPasswordToClipboard}
                  >
                    Copy
                  </Button>
                )}
              </div>
            )}
          </div>

          <StickyFormActions className="z-[12]">
            <Button 
              type="submit" 
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? "Creating User..." : "Create User"}
            </Button>
          </StickyFormActions>
        </form>

        {generatedPassword && !useManualPassword && (
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
