// ABOUTME: Secure Google Sheets integration hook with database-level encryption 
// ABOUTME: Uses secure RLS policies and encrypted token storage to prevent token theft

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { enhancedSecurityLogger } from '@/utils/enhancedSecurityLogger';

interface SafeGoogleSheetsIntegration {
  id: string;
  user_id: string;
  sheet_id: string;
  sheet_name?: string;
  is_active: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
  range_specification?: string;
  column_mappings?: any;
  token_status: 'configured' | 'not_configured'; // No actual token exposed
}

interface CreateIntegrationParams {
  sheet_id: string;
  sheet_name?: string;
  access_token: string;
  range_specification?: string;
  column_mappings?: any;
}

export const useSecureGoogleSheetsIntegration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch integrations using secure function (no access tokens exposed)
  const { data: integrations, isLoading, error } = useQuery({
    queryKey: ['secure-google-integrations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Use the secure function that excludes access tokens entirely
      const { data, error } = await supabase
        .rpc('get_user_integrations');

      if (error) throw error;

      // Log security event for integration access
      try {
        await enhancedSecurityLogger.logEvent({
          eventType: 'admin_action',
          resourceAccessed: 'google_sheets_integrations',
          actionAttempted: 'view_integrations',
          success: true,
          riskLevel: 'low',
          metadata: { userId: user.id, count: data?.length || 0 }
        });
      } catch (logError) {
        console.warn('Failed to log security event:', logError);
      }

      return data as SafeGoogleSheetsIntegration[];
    },
    enabled: !!user,
  });

  // Create integration (uses secure token handling)
  const createIntegration = useMutation({
    mutationFn: async (params: CreateIntegrationParams) => {
      if (!user) throw new Error('Not authenticated');

      // Step 1: Create integration record without token (security requirement)
      const safeIntegrationData = {
        user_id: user.id,
        sheet_id: params.sheet_id,
        sheet_name: params.sheet_name,
        range_specification: params.range_specification || 'A:Z',
        column_mappings: params.column_mappings || {},
        is_active: true,
      };

      const { data, error } = await supabase
        .from('google_sheets_integrations')
        .insert(safeIntegrationData)
        .select()
        .single();

      if (error) throw error;

      // Step 2: Securely set the access token using the secure function
      try {
        await supabase.rpc('update_integration_token', {
          integration_id: data.id,
          new_token: params.access_token,
        });
      } catch (tokenError) {
        // If token update fails, clean up the integration
        await supabase
          .from('google_sheets_integrations')
          .delete()
          .eq('id', data.id);
        
        throw new Error('Failed to securely store access token');
      }

      // Log security event
      try {
        await enhancedSecurityLogger.logAdminAction(
          'integration_created',
          data.id,
          true,
          { sheet_id: params.sheet_id, sheet_name: params.sheet_name }
        );
      } catch (logError) {
        console.warn('Failed to log security event:', logError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-google-integrations'] });
      toast({
        title: "Integration Created",
        description: "Google Sheets integration has been created with secure token storage.",
      });
    },
    onError: (error: any) => {
      console.error('Integration creation failed:', error);
      toast({
        title: "Integration Failed",
        description: error.message || "Failed to create Google Sheets integration.",
        variant: "destructive",
      });
    },
  });

  // Update integration metadata (excludes token updates)
  const updateIntegration = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SafeGoogleSheetsIntegration> }) => {
      // Remove any sensitive fields that shouldn't be updated directly
      const { token_status, ...safeUpdates } = updates;
      
      const { data, error } = await supabase
        .from('google_sheets_integrations')
        .update(safeUpdates)
        .eq('id', id)
        .eq('user_id', user?.id) // Ensure user can only update their own
        .select()
        .single();

      if (error) throw error;

      // Log security event
      try {
        await enhancedSecurityLogger.logAdminAction(
          'integration_updated',
          id,
          true,
          { updatedFields: Object.keys(safeUpdates) }
        );
      } catch (logError) {
        console.warn('Failed to log security event:', logError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-google-integrations'] });
      toast({
        title: "Integration Updated",
        description: "Google Sheets integration has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update Google Sheets integration.",
        variant: "destructive",
      });
    },
  });

  // Delete integration
  const deleteIntegration = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('google_sheets_integrations')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id); // Ensure user can only delete their own

      if (error) throw error;

      // Log security event
      try {
        await enhancedSecurityLogger.logAdminAction(
          'integration_deleted',
          id,
          true,
          { operation: 'delete_integration' }
        );
      } catch (logError) {
        console.warn('Failed to log security event:', logError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-google-integrations'] });
      toast({
        title: "Integration Deleted",
        description: "Google Sheets integration has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete Google Sheets integration.",
        variant: "destructive",
      });
    },
  });

  // Secure token update function
  const updateAccessToken = async (integrationId: string, newToken: string): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('update_integration_token', {
        integration_id: integrationId,
        new_token: newToken,
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['secure-google-integrations'] });
      
      toast({
        title: "Token Updated",
        description: "Access token has been securely updated.",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Token Update Failed",
        description: error.message || "Failed to update access token",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    integrations,
    isLoading,
    error,
    createIntegration: createIntegration.mutate,
    isCreating: createIntegration.isPending,
    updateIntegration: updateIntegration.mutate,
    isUpdating: updateIntegration.isPending,
    deleteIntegration: deleteIntegration.mutate,
    isDeleting: deleteIntegration.isPending,
    updateAccessToken, // Secure token update method
  };
};