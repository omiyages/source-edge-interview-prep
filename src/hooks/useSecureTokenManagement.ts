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

  // SECURITY: This hook is now DEPRECATED for token security
  // All token operations should use the secure Google API proxy instead
  
  const validateTokenStatus = async (integrationId: string) => {
    try {
      const { data, error } = await supabase.rpc('validate_google_token_status', {
        integration_id: integrationId,
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast({
        title: 'Validation Failed',
        description: error.message || 'Failed to validate token status',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const triggerSecureOAuth = (integrationId: string) => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent('https://satshobhbkjptsbmfsia.supabase.co/functions/v1/google-oauth-callback')}&response_type=code&scope=https://www.googleapis.com/auth/spreadsheets&access_type=offline&state=${integrationId}`;
    
    const popup = window.open(authUrl, 'google-auth', 'width=500,height=600');
    
    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          reject(new Error('OAuth cancelled by user'));
        }
      }, 1000);

      const messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          popup?.close();
          window.removeEventListener('message', messageHandler);
          queryClient.invalidateQueries({ queryKey: ['secure-google-integrations'] });
          resolve(event.data);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          clearInterval(checkClosed);
          popup?.close();
          window.removeEventListener('message', messageHandler);
          reject(new Error(event.data.error));
        }
      };

      window.addEventListener('message', messageHandler);
    });
  };

  return {
    validateTokenStatus,
    triggerSecureOAuth,
    // DEPRECATED: These methods are removed for security
    // Use makeSecureGoogleAPICall from useSecureGoogleSheetsIntegration instead
  };
};