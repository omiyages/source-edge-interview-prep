
// ABOUTME: Hook for managing Google Sheets integrations with real-time progress tracking
// ABOUTME: Handles CRUD operations and sync functionality with background processing support

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useRef } from 'react';

interface SyncProgress {
  current: number;
  total: number;
  status: 'idle' | 'starting' | 'processing' | 'completed' | 'error';
  errors: string[];
  createdCount?: number;
  updatedCount?: number;
}

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
}

interface CreateGoogleSheetsIntegrationData {
  sheet_id: string;
  sheet_name?: string | null;
  range_specification?: string;
  column_mappings?: Record<string, string>;
}

interface UpdateGoogleSheetsIntegrationData {
  id: string;
  sheet_name?: string | null;
  range_specification?: string;
  column_mappings?: Record<string, string>;
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

export const useUpdateGoogleSheetsIntegration = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (integration: UpdateGoogleSheetsIntegrationData) => {
      const { data, error } = await supabase
        .from('google_sheets_integrations')
        .update({
          sheet_name: integration.sheet_name,
          range_specification: integration.range_specification,
          column_mappings: integration.column_mappings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-sheets-integrations'] });
      toast({
        title: 'Integration updated',
        description: 'Google Sheets integration has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update integration: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

export const useSyncGoogleSheets = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    current: 0,
    total: 0,
    status: 'idle',
    errors: [],
    createdCount: 0,
    updatedCount: 0
  });
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentIntegrationIdRef = useRef<string | null>(null);

  // Function to poll progress with better error handling
  const pollProgress = async (integrationId: string) => {
    try {
      console.log('🔍 Polling progress for integration:', integrationId);
      
      const { data, error } = await supabase.functions.invoke('google-sheets-sync', {
        body: {
          integrationId,
          action: 'check_progress'
        },
      });

      if (error) {
        console.error('❌ Progress polling error:', error);
        return;
      }

      if (data?.success && data?.progress) {
        const progress = data.progress;
        console.log('📊 Progress update:', progress);
        
        // Ensure we have valid numbers for current and total
        const current = Math.max(0, progress.processed || progress.current || 0);
        const total = Math.max(current, progress.total || 0);
        
        setSyncProgress(prev => ({
          current: current,
          total: total,
          status: progress.status === 'idle' ? prev.status : progress.status,
          errors: progress.errorMessages || progress.errors || [],
          createdCount: progress.created || progress.createdCount || 0,
          updatedCount: progress.updated || progress.updatedCount || 0
        }));

        // Stop polling if completed or error
        if (progress.status === 'completed' || progress.status === 'error') {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          
          if (progress.status === 'completed') {
            toast({
              title: 'Sync completed',
              description: `Successfully processed ${current} candidates (${progress.created || progress.createdCount || 0} created, ${progress.updated || progress.updatedCount || 0} updated)`,
            });
            
            // Update the integration's last_sync_at timestamp
            if (currentIntegrationIdRef.current) {
              await supabase
                .from('google_sheets_integrations')
                .update({ last_sync_at: new Date().toISOString() })
                .eq('id', currentIntegrationIdRef.current);
            }
            
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['google-sheets-integrations'] });
            queryClient.invalidateQueries({ queryKey: ['candidates-with-pipeline'] });
          } else if (progress.status === 'error') {
            toast({
              title: 'Sync failed',
              description: progress.errorMessages?.[0] || progress.errors?.[0] || 'Sync encountered errors',
              variant: 'destructive',
            });
          }
          
          // Reset status after delay
          setTimeout(() => {
            setSyncProgress(prev => ({ ...prev, status: 'idle' }));
          }, 3000);
        }
      }
    } catch (error) {
      console.error('❌ Progress polling failed:', error);
    }
  };

  // Start polling function with more aggressive polling
  const startPolling = (integrationId: string) => {
    currentIntegrationIdRef.current = integrationId;
    
    // Clear any existing polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    // Start polling every 1 second for more responsive updates
    pollIntervalRef.current = setInterval(() => {
      if (currentIntegrationIdRef.current) {
        pollProgress(currentIntegrationIdRef.current);
      }
    }, 1000);
    
    // Also poll immediately
    pollProgress(integrationId);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const mutation = useMutation({
    mutationFn: async (integrationId: string) => {
      console.log('🚀 Starting sync for integration:', integrationId);
      
      try {
        // Get integration data
        const { data: integration, error: integrationError } = await supabase
          .from('google_sheets_integrations')
          .select('*')
          .eq('id', integrationId)
          .single();

        if (integrationError) throw integrationError;

        console.log('📋 Integration details:', {
          sheetId: integration.sheet_id,
          range: integration.range_specification,
          mappings: Object.keys(integration.column_mappings || {}).length
        });

        // Reset progress state with better initial values
        setSyncProgress({
          current: 0,
          total: 0,
          status: 'starting',
          errors: [],
          createdCount: 0,
          updatedCount: 0
        });

        // Start the sync process
        console.log('🔄 Calling sync function...');
        const { data, error: syncError } = await supabase.functions.invoke('google-sheets-sync', {
          body: {
            integrationId: integration.id,
            sheetId: integration.sheet_id,
            range: integration.range_specification,
            columnMappings: integration.column_mappings,
          },
        });

        if (syncError) {
          console.error('❌ Sync function error:', syncError);
          throw syncError;
        }

        console.log('✅ Sync started successfully:', data);

        // Update initial progress with actual total from the response
        const totalRows = Math.max(1, (data?.totalRows || 0));
        setSyncProgress(prev => ({
          ...prev,
          total: totalRows,
          status: 'processing'
        }));

        // Start polling for progress updates
        startPolling(integration.id);

        return data;
        
      } catch (error) {
        console.error('❌ Sync failed with error:', error);
        setSyncProgress(prev => ({
          ...prev,
          status: 'error',
          errors: [error?.message || 'Sync failed']
        }));
        throw error;
      }
    },
    onError: (error) => {
      console.error('❌ Sync mutation failed:', error);
      toast({
        title: 'Sync failed',
        description: `Failed to start sync: ${error.message}`,
        variant: 'destructive',
      });
      
      // Reset progress on error after delay
      setTimeout(() => {
        setSyncProgress(prev => ({ ...prev, status: 'idle' }));
      }, 3000);
    },
  });

  return {
    ...mutation,
    syncProgress
  };
};
