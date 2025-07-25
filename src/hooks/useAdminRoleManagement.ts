
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
      // First check if current user is admin
      const { data: currentUser, error: userError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (userError || currentUser?.role !== 'admin') {
        throw new Error('Only admins can update user roles');
      }

      // Get the current role for audit logging
      const { data: targetUser, error: targetError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (targetError) throw targetError;

      // Update the user's role directly
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (updateError) throw updateError;

      return { userId, newRole, oldRole: targetUser.role };
    },
    onSuccess: (data, { userId, newRole, reason }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      
      // Log the admin action
      logAdminAction(
        `Role updated from ${data.oldRole} to ${newRole} for user ${userId}`,
        user?.id,
        { targetUserId: userId, newRole, oldRole: data.oldRole, reason }
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
