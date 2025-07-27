
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useMakeCandidateInactive = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ applicationId }: { applicationId: string }) => {
      console.log('🔄 Making candidate inactive:', { applicationId });
      
      const { error } = await supabase
        .from('candidate_pipeline')
        .update({ is_active: false })
        .eq('id', applicationId);

      if (error) {
        console.error('❌ Error making candidate inactive:', error);
        throw error;
      }
      
      console.log('✅ Candidate made inactive successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates-with-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['hiring-stages'] });
      toast.success('Candidate marked as inactive');
    },
    onError: (error) => {
      console.error('❌ Failed to make candidate inactive:', error);
      toast.error('Failed to mark candidate as inactive');
    },
  });
};
