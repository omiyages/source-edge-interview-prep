
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
      console.log('🔄 Starting user creation...');
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('No active session found. Please sign in again.');
      }

      console.log('✅ Session verified');

      // Prepare request data
      const requestData = {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        fullName: data.fullName.trim()
      };

      console.log('📦 Sending request with data:', { 
        email: requestData.email, 
        fullName: requestData.fullName,
        hasPassword: !!requestData.password 
      });
      
      // Call the edge function
      const { data: result, error: functionError } = await supabase.functions.invoke('admin-user-management', {
        body: JSON.stringify(requestData),
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Function response:', { result, error: functionError });

      if (functionError) {
        console.error('❌ Function call error:', functionError);
        throw new Error(`Function call failed: ${functionError.message}`);
      }
      
      if (result?.error) {
        console.error('❌ Function returned error:', result.error);
        throw new Error(result.error);
      }

      if (!result?.success) {
        console.error('❌ Unexpected response:', result);
        throw new Error('User creation failed');
      }

      console.log('✅ User created successfully');

      toast({
        title: "Success!",
        description: `User ${data.email} has been created successfully.`,
      });

      form.reset();
      setOpen(false);
      onSuccess();
      
    } catch (error: any) {
      console.error('❌ Error creating user:', error);
      
      toast({
        title: "Error Creating User",
        description: error?.message || 'Failed to create user. Please try again.',
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
