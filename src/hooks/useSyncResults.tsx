
// ABOUTME: Hook for managing sync results and approval workflow
// ABOUTME: Handles post-sync preview data and approval process

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SyncCandidate {
  id?: string;
  full_name: string;
  email?: string;
  current_company?: string;
  applied_company?: string;
  applied_job_title?: string;
  stage?: string;
  is_active: boolean;
  action: 'created' | 'updated';
  row_number: number;
}

interface SyncResults {
  candidates: SyncCandidate[];
  summary: {
    total: number;
    created: number;
    updated: number;
    skipped: number;
    errors: string[];
  };
}

export const useSyncResults = () => {
  const [syncResults, setSyncResults] = useState<SyncResults | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  const fetchSyncResults = useCallback(async (integrationId: string) => {
    try {
      console.log('🔍 Fetching sync results for integration:', integrationId);
      
      // Call edge function to get sync results
      const { data, error } = await supabase.functions.invoke('google-sheets-sync-results', {
        body: { integrationId }
      });

      if (error) throw error;

      if (data?.success && data?.results) {
        setSyncResults(data.results);
        return data.results;
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to fetch sync results:', error);
      toast.error(`Failed to fetch sync results: ${error.message}`);
      return null;
    }
  }, []);

  const approveSyncResults = useCallback(async (integrationId: string) => {
    if (!syncResults) {
      throw new Error('No sync results to approve');
    }

    setIsApproving(true);
    try {
      console.log('✅ Approving sync results for integration:', integrationId);
      
      // Call edge function to apply the changes
      const { data, error } = await supabase.functions.invoke('google-sheets-apply-sync', {
        body: { 
          integrationId,
          results: syncResults
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Changes applied successfully! ${data.message}`);
        setSyncResults(null);
        return true;
      } else {
        throw new Error(data?.error || 'Failed to apply changes');
      }
    } catch (error) {
      console.error('❌ Failed to apply sync results:', error);
      toast.error(`Failed to apply changes: ${error.message}`);
      throw error;
    } finally {
      setIsApproving(false);
    }
  }, [syncResults]);

  const rejectSyncResults = useCallback(() => {
    console.log('❌ Rejecting sync results');
    setSyncResults(null);
    toast.info('Sync results have been discarded');
  }, []);

  return {
    syncResults,
    isApproving,
    fetchSyncResults,
    approveSyncResults,
    rejectSyncResults,
    setSyncResults
  };
};
