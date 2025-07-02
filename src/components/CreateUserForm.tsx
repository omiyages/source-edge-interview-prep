
import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

interface CreateUserFormData {
  fullName: string;
  email: string;
  password: string;
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
    },
  });

  const handleCreateUser = async (data: CreateUserFormData) => {
    setLoading(true);
    
    try {
      console.log('🔄 Starting user creation process...');
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        throw new Error(`Session error: ${sessionError.message}`);
      }
      
      if (!session?.access_token) {
        console.error('❌ No active session found');
        throw new Error('No active session found. Please sign in again.');
      }

      console.log('✅ Session verified, calling edge function...');

      // Prepare request data - simple object
      const requestPayload = {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        fullName: data.fullName.trim()
      };

      console.log('📦 Request payload:', { 
        email: requestPayload.email, 
        fullName: requestPayload.fullName,
        hasPassword: !!requestPayload.password 
      });
      
      // Call the edge function with detailed logging
      const { data: result, error: functionError } = await supabase.functions.invoke('admin-user-management', {
        body: requestPayload,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Edge function response:', { result, functionError });

      // Handle function call errors (network, etc.)
      if (functionError) {
        console.error('❌ Function call error:', functionError);
        
        // Try to get more details from the error
        let errorMessage = 'Failed to create user. Please try again.';
        if (functionError.message) {
          errorMessage = `Function error: ${functionError.message}`;
        }
        
        throw new Error(errorMessage);
      }

      // Handle application errors returned in the response
      if (result?.error) {
        console.error('❌ Application error from edge function:', result.error);
        throw new Error(result.error);
      }

      // Check for success
      if (!result?.success) {
        console.error('❌ Unexpected response format:', result);
        throw new Error('Unexpected response from server. Please try again.');
      }

      console.log('✅ User created successfully!');

      toast({
        title: "Success!",
        description: `User ${data.email} has been created successfully.`,
      });

      form.reset();
      setOpen(false);
      onSuccess();
      
    } catch (error: any) {
      console.error('❌ Error in handleCreateUser:', error);
      
      let displayMessage = 'Failed to create user. Please try again.';
      
      if (error?.message) {
        displayMessage = error.message;
      }
      
      // Handle specific common errors
      if (displayMessage.includes('already_registered') || displayMessage.includes('already exists')) {
        displayMessage = 'A user with this email already exists.';
      } else if (displayMessage.includes('email')) {
        displayMessage = 'Email configuration issue. Please check your email settings.';
      }
      
      toast({
        title: "Error Creating User",
        description: displayMessage,
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
      <DialogContent className="sm:max-w-[425px]">
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
            
            <div className="flex justify-end gap-2">
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
