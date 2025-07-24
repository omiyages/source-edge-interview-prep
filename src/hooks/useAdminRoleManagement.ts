
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logAdminAction } from "@/utils/securityLogger";
import { useAuth } from "@/hooks/useAuth";

interface UpdateRoleParams {
  userId: string;
  newRole: 'admin' | 'user';
  reason?: string;
}

export const useAdminRoleManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, newRole, reason }: UpdateRoleParams) => {
      const { data, error } = await supabase.rpc('update_user_role', {
        target_user_id: userId,
        new_role: newRole,
        reason: reason || null
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { userId, newRole, reason }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      
      // Log the admin action
      logAdminAction(
        `Role updated to ${newRole} for user ${userId}`,
        user?.id,
        { targetUserId: userId, newRole, reason }
      );

      toast({
        title: "Role Updated",
        description: `User role has been successfully updated to ${newRole}.`,
      });
    },
    onError: (error: any) => {
      console.error('Role update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  return { updateUserRole };
};
