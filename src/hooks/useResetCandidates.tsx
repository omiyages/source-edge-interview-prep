
// ABOUTME: Hook for resetting all candidate data from the database
// ABOUTME: Provides complete database cleanup functionality for fresh starts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useResetCandidates = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      console.log('🗑️ Starting complete candidate database reset...');
      
      // First delete all candidate pipeline entries
      const { error: pipelineError } = await supabase
        .from('candidate_pipeline')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
      
      if (pipelineError) {
        console.error('❌ Error deleting candidate pipeline:', pipelineError);
        throw new Error('Failed to delete candidate pipeline entries');
      }
      
      // Then delete all Google Sheets imports
      const { error: importsError } = await supabase
        .from('google_sheets_candidate_imports')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
      
      if (importsError) {
        console.error('❌ Error deleting Google Sheets imports:', importsError);
        throw new Error('Failed to delete Google Sheets import records');
      }
      
      // Finally delete all candidates
      const { error: candidatesError } = await supabase
        .from('candidates')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
      
      if (candidatesError) {
        console.error('❌ Error deleting candidates:', candidatesError);
        throw new Error('Failed to delete candidates');
      }
      
      console.log('✅ Complete candidate database reset successful');
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['candidates-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['hiring-stages'] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      toast.success('Database reset successfully - all candidate data removed');
    },
    onError: (error: any) => {
      console.error('❌ Failed to reset database:', error);
      toast.error(`Failed to reset database: ${error.message}`);
    },
  });
};
