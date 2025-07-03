
import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

interface CreateUserFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'user' | 'admin';
}

interface CreateUserFormProps {
  onSuccess: () => void;
}

export const CreateUserForm = ({ onSuccess }: CreateUserFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<CreateUserFormData>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "user",
    },
  });

  const handleCreateUser = async (data: CreateUserFormData) => {
    console.log('🚀 Starting user creation...');
    
    // Validate password confirmation
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
      // Get current session
      console.log('🔐 Getting session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        console.error('❌ Session error:', sessionError);
        throw new Error('Please sign in again');
      }

      console.log('✅ Session valid for:', session.user.email);

      // Prepare payload
      const payload = {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        fullName: data.fullName.trim(),
        role: data.role
      };

      console.log('📤 Calling function with:', {
        email: payload.email,
        fullName: payload.fullName,
        role: payload.role
      });

      // Call edge function
      const { data: result, error: functionError } = await supabase.functions.invoke('admin-user-management', {
        body: payload,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Function response:', { result, functionError });

      if (functionError) {
        console.error('❌ Function error:', functionError);
        throw new Error(`Function call failed: ${functionError.message}`);
      }

      if (result?.error) {
        console.error('❌ Server error:', result.error);
        throw new Error(result.error);
      }

      if (!result?.success) {
        console.error('❌ Unexpected response:', result);
        throw new Error('Unexpected server response');
      }

      console.log('🎉 User created successfully!');

      toast({
        title: "Success!",
        description: `User ${data.email} has been created successfully with role: ${data.role}`,
      });

      form.reset();
      setOpen(false);
      onSuccess();
      
    } catch (error: any) {
      console.error('💥 Error creating user:', error);
      
      let userMessage = 'An unexpected error occurred';
      
      if (error?.message) {
        if (error.message.includes('already exists') || error.message.includes('already_registered')) {
          userMessage = 'A user with this email already exists';
        } else if (error.message.includes('sign in again')) {
          userMessage = 'Please sign out and sign in again';
        } else if (error.message.includes('Admin access required')) {
          userMessage = 'You do not have admin privileges';
        } else {
          userMessage = error.message;
        }
      }
      
      toast({
        title: "Error Creating User",
        description: userMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              rules={{ required: "Full name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
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
                    <Input type="email" placeholder="Enter email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              rules={{ required: "Role is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
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
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
