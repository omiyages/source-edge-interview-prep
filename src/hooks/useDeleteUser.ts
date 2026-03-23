
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useDeleteUser = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (userId: string) => {
      const token = await getToken();
      if (!token) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          method: 'DELETE_USER',
          body: { userId }
        },
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "User Deleted",
        description: "User has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });
};
