
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
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<CreateUserFormData>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "user",
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserFormData) => {
      console.log('🚀 Starting user creation process...');
      
      // Validate password confirmation
      if (data.password !== data.confirmPassword) {
        console.error('❌ Password mismatch');
        throw new Error('Passwords do not match.');
      }
      
      // Get current session
      console.log('🔐 Getting current session...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        throw new Error('Failed to get session: ' + sessionError.message);
      }

      if (!sessionData?.session?.access_token) {
        console.error('❌ No valid session found');
        throw new Error('Please sign in again - no valid session');
      }

      console.log('✅ Session valid for user:', sessionData.session.user.email);

      // Create user directly using Supabase admin functions through our edge function
      const payload = {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        fullName: data.fullName.trim(),
        role: data.role
      };

      console.log('📤 Calling admin-user-management function...');
      
      const response = await fetch(`https://satshobhbkjptsbmfsia.supabase.co/functions/v1/admin-user-management`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdHNob2JoYmtqcHRzYm1mc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDI5NjUsImV4cCI6MjA2NjMxODk2NX0.T_q1HFL4SQEdzjWjJtfX9WRiHjQLK5WaoH8bCKsLP2c',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      console.log('📥 Function response:', { status: response.status, result });

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.success) {
        throw new Error('Server returned unexpected response format');
      }

      console.log('🎉 User created successfully!', result.user);
      return result;
    },
    onSuccess: (result, data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      toast({
        title: "Success!",
        description: `User ${data.email} has been created successfully with role: ${data.role}`,
      });
      form.reset();
      setOpen(false);
      onSuccess();
    },
    onError: (error: any) => {
      console.error('💥 Error in user creation process:', error);
      
      let userMessage = 'An unexpected error occurred while creating the user';
      
      if (error?.message) {
        if (error.message.includes('already exists') || error.message.includes('already_registered')) {
          userMessage = 'A user with this email already exists';
        } else if (error.message.includes('sign in again') || error.message.includes('session')) {
          userMessage = 'Please sign out and sign in again';
        } else if (error.message.includes('Admin access required')) {
          userMessage = 'You do not have admin privileges';
        } else if (error.message === 'Passwords do not match.') {
          userMessage = error.message;
        } else {
          userMessage = error.message;
        }
      }
      
      console.error('📢 Showing error to user:', userMessage);
      
      toast({
        title: "Error Creating User",
        description: userMessage,
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = async (data: CreateUserFormData) => {
    createUserMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-gradient hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 transition-all duration-300 text-white font-medium">
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
                  <FormLabel>Full Name *</FormLabel>
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
                  <FormLabel>Email *</FormLabel>
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
                  <FormLabel>Role *</FormLabel>
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
                  <FormLabel>Password *</FormLabel>
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
                  <FormLabel>Confirm Password *</FormLabel>
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
                disabled={createUserMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createUserMutation.isPending} className="bg-purple-gradient hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 transition-all duration-300 text-white font-medium">
                {createUserMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
