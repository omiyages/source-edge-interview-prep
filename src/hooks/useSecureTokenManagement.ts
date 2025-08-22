// ABOUTME: Secure token management hook for Google Sheets integrations
// ABOUTME: Provides controlled access to encrypted access tokens through secure functions

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TokenUpdateParams {
  integrationId: string;
  accessToken: string;
}

export const useSecureTokenManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateToken = useMutation({
    mutationFn: async ({ integrationId, accessToken }: TokenUpdateParams) => {
      const { data, error } = await supabase.rpc('update_integration_token', {
        integration_id: integrationId,
        new_token: accessToken,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safe-google-integrations'] });
      toast({
        title: 'Token Updated',
        description: 'Access token has been securely updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update access token',
        variant: 'destructive',
      });
    },
  });

  const getToken = useMutation({
    mutationFn: async (integrationId: string) => {
      const { data, error } = await supabase.rpc('get_user_integration_token', {
        integration_id: integrationId,
      });

      if (error) throw error;
      return data;
    },
    onError: (error: any) => {
      toast({
        title: 'Access Denied',
        description: 'Unable to retrieve access token. You may not have permission to access this integration.',
        variant: 'destructive',
      });
    },
  });

  return {
    updateToken: updateToken.mutateAsync,
    getToken: getToken.mutateAsync,
    isUpdatingToken: updateToken.isPending,
    isGettingToken: getToken.isPending,
  };
};