// ABOUTME: Secure Google Sheets integration hook with encrypted token storage
// ABOUTME: Provides encrypted OAuth token management for Google Sheets integrations

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { tokenEncryptionService } from '@/services/tokenEncryptionService';
import { useToast } from '@/hooks/use-toast';

interface GoogleSheetsIntegration {
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
  access_token?: string;
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
  const [isEncrypting, setIsEncrypting] = useState(false);

  // Fetch integrations (access_token will be encrypted in DB)
  const { data: integrations, isLoading, error } = useQuery({
    queryKey: ['google-sheets-integrations', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('google_sheets_integrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GoogleSheetsIntegration[];
    },
    enabled: !!user,
  });

  // Create integration with encrypted token
  const createIntegration = useMutation({
    mutationFn: async (params: CreateIntegrationParams) => {
      if (!user) throw new Error('Not authenticated');

      setIsEncrypting(true);
      try {
        // Encrypt the access token
        const { encryptedData, iv } = await tokenEncryptionService.encryptToken(params.access_token);
        
        // Store encrypted token and IV together
        const encryptedToken = JSON.stringify({ encryptedData, iv });

        const { data, error } = await supabase
          .from('google_sheets_integrations')
          .insert({
            user_id: user.id,
            sheet_id: params.sheet_id,
            sheet_name: params.sheet_name,
            access_token: encryptedToken,
            range_specification: params.range_specification || 'A:Z',
            column_mappings: params.column_mappings || {},
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } finally {
        setIsEncrypting(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-sheets-integrations'] });
      toast({
        title: "Integration created",
        description: "Google Sheets integration has been created successfully with encrypted token storage.",
      });
    },
    onError: (error: any) => {
      console.error('Integration creation failed:', error);
      toast({
        title: "Integration failed",
        description: error.message || "Failed to create Google Sheets integration.",
        variant: "destructive",
      });
    },
  });

  // Decrypt and retrieve access token
  const getDecryptedToken = useCallback(async (integration: GoogleSheetsIntegration): Promise<string | null> => {
    try {
      if (!integration.access_token) {
        return null;
      }

      // Parse the encrypted token data
      const tokenData = JSON.parse(integration.access_token);
      
      // Decrypt the token
      const decryptedToken = await tokenEncryptionService.decryptToken(
        tokenData.encryptedData,
        tokenData.iv
      );

      return decryptedToken;
    } catch (error) {
      console.error('Token decryption failed:', error);
      toast({
        title: "Token Error",
        description: "Failed to decrypt access token. Please re-authenticate.",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  // Update integration
  const updateIntegration = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<GoogleSheetsIntegration> }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('google_sheets_integrations')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-sheets-integrations'] });
      toast({
        title: "Integration updated",
        description: "Google Sheets integration has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update Google Sheets integration.",
        variant: "destructive",
      });
    },
  });

  // Delete integration
  const deleteIntegration = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('google_sheets_integrations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-sheets-integrations'] });
      toast({
        title: "Integration deleted",
        description: "Google Sheets integration has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete Google Sheets integration.",
        variant: "destructive",
      });
    },
  });

  return {
    integrations,
    isLoading,
    error,
    isEncrypting,
    createIntegration: createIntegration.mutate,
    isCreating: createIntegration.isPending,
    updateIntegration: updateIntegration.mutate,
    isUpdating: updateIntegration.isPending,
    deleteIntegration: deleteIntegration.mutate,
    isDeleting: deleteIntegration.isPending,
    getDecryptedToken,
  };
};