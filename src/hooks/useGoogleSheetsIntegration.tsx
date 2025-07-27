
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface GoogleSheetsIntegration {
  id: string;
  user_id: string;
  sheet_id: string;
  sheet_name: string | null;
  range_specification: string;
  column_mappings: Record<string, string>;
  last_sync_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  access_token?: string | null;
}

interface CreateGoogleSheetsIntegrationData {
  sheet_id: string;
  sheet_name?: string | null;
  range_specification?: string;
  column_mappings?: Record<string, string>;
  access_token?: string | null;
}

export const useGoogleSheetsIntegrations = () => {
  return useQuery({
    queryKey: ['google-sheets-integrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('google_sheets_integrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GoogleSheetsIntegration[];
    },
  });
};

export const useCreateGoogleSheetsIntegration = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (integration: CreateGoogleSheetsIntegrationData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('google_sheets_integrations')
        .insert({
          user_id: user.id,
          sheet_id: integration.sheet_id,
          sheet_name: integration.sheet_name,
          range_specification: integration.range_specification || 'A:Z',
          column_mappings: integration.column_mappings || {},
          access_token: integration.access_token,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-sheets-integrations'] });
      toast({
        title: 'Integration created',
        description: 'Google Sheets integration has been set up successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create integration: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

export const useSyncGoogleSheets = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (integrationId: string) => {
      const { data: integration, error } = await supabase
        .from('google_sheets_integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (error) throw error;

      const { data, error: syncError } = await supabase.functions.invoke('google-sheets-sync', {
        body: {
          integrationId: integration.id,
          sheetId: integration.sheet_id,
          range: integration.range_specification,
          columnMappings: integration.column_mappings,
          accessToken: integration.access_token,
        },
      });

      if (syncError) throw syncError;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['google-sheets-integrations'] });
      queryClient.invalidateQueries({ queryKey: ['candidates-with-pipeline'] });
      toast({
        title: 'Sync completed',
        description: `Successfully imported ${data.imported_count} candidates from Google Sheets.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Sync failed',
        description: `Failed to sync with Google Sheets: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};
