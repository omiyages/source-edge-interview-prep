
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
      if (sessionError || !session?.access_token) {
        throw new Error('No active session found. Please sign in again.');
      }

      console.log('📞 Calling admin-user-management function...');
      
      // Simplified request payload - send data directly
      const requestPayload = {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        fullName: data.fullName.trim()
      };

      console.log('📦 Request payload:', requestPayload);
      
      // Call the edge function
      const { data: result, error: functionError } = await supabase.functions.invoke('admin-user-management', {
        body: requestPayload,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Function result:', result);
      console.log('⚠️ Function error:', functionError);

      // Handle function call errors
      if (functionError) {
        console.error('❌ Supabase function error:', functionError);
        throw new Error(`Function call failed: ${functionError.message || 'Unknown error'}`);
      }
      
      // Handle errors returned by the function
      if (result?.error) {
        console.error('❌ Function returned error:', result.error);
        throw new Error(result.error);
      }

      // Check for success
      if (!result?.success) {
        console.error('❌ Function did not return success:', result);
        throw new Error('User creation failed - unexpected response format');
      }

      console.log('✅ User created successfully:', result);

      // Show success message
      toast({
        title: "Success!",
        description: `User ${data.email} has been created successfully.`,
      });

      // Reset form and close dialog
      form.reset();
      setOpen(false);
      onSuccess();
      
    } catch (error: any) {
      console.error('❌ Error creating user:', error);
      
      // Determine error message
      let errorMessage = 'Failed to create user. Please try again.';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Show error toast
      toast({
        title: "Error Creating User",
        description: errorMessage,
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
