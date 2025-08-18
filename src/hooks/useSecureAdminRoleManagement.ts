
// ABOUTME: Secure admin role management hook using database-level security functions
// ABOUTME: Implements proper rate limiting and audit logging for role changes

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logAdminAction, logRateLimitExceeded } from "@/utils/securityLogger";
import { useAuth } from "@/hooks/useAuth";

interface UpdateRoleParams {
  userId: string;
  newRole: 'admin' | 'user';
  reason?: string;
}

export const useSecureAdminRoleManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, newRole, reason }: UpdateRoleParams) => {
      console.log('🔐 Attempting secure role update:', { userId, newRole, reason });

      // Check rate limit first
      const { data: rateLimitCheck, error: rateLimitError } = await supabase
        .rpc('check_rate_limit', { 
          operation_name: 'role_update',
          max_attempts: 3,
          window_minutes: 10
        });

      if (rateLimitError) {
        console.error('Rate limit check failed:', rateLimitError);
        throw new Error('Security check failed');
      }

      if (!rateLimitCheck) {
        logRateLimitExceeded('Role update rate limit exceeded', user?.id);
        throw new Error('Too many role update attempts. Please wait before trying again.');
      }

      // Get client IP and user agent for audit logging
      const userAgent = navigator.userAgent;
      
      // Use the secure database function for role updates
      const { data, error } = await supabase
        .rpc('update_user_role_with_audit', {
          target_user_id: userId,
          new_role: newRole,
          reason: reason || 'Admin role change via UI',
          user_agent: userAgent
        });

      if (error) {
        console.error('Secure role update failed:', error);
        throw error;
      }

      if (data?.error) {
        console.error('Role update rejected:', data.error);
        throw new Error(data.error);
      }

      console.log('✅ Secure role update successful:', data);
      return data;
    },
    onSuccess: (data, { userId, newRole, reason }) => {
      // Optimized cache invalidation
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      
      // Log the successful admin action
      logAdminAction(
        `Secure role update: ${data.old_role} → ${newRole} for user ${userId}`,
        user?.id,
        { 
          targetUserId: userId, 
          newRole, 
          oldRole: data.old_role, 
          reason,
          secureUpdate: true 
        }
      );

      toast({
        title: "Role Updated Securely",
        description: `User role has been successfully updated from ${data.old_role} to ${newRole}.`,
      });
    },
    onError: (error: any) => {
      console.error('Secure role update error:', error);
      
      // Log security event
      logAdminAction(
        `Failed role update attempt: ${error.message}`,
        user?.id,
        { error: error.message, secureUpdate: true }
      );

      toast({
        title: "Security Error",
        description: error.message || "Failed to update user role securely",
        variant: "destructive",
      });
    },
  });

  return { updateUserRole };
};
