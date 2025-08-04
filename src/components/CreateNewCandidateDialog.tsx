import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateNewCandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCandidateCreated?: (candidate: any) => void;
}

export const CreateNewCandidateDialog = ({ 
  open, 
  onOpenChange, 
  onCandidateCreated
}: CreateNewCandidateDialogProps) => {
  const [formData, setFormData] = useState({
    full_name: '',
    applied_company: '',
    applied_job_title: ''
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Create the candidate first
      const { data: candidate, error: candidateError } = await supabase
        .from('candidates')
        .insert({
          full_name: data.full_name,
          email: null, // No email required for quick creation
          is_active: true
        })
        .select()
        .single();

      if (candidateError) throw candidateError;

      // Get the first hiring stage
      const { data: stages, error: stagesError } = await supabase
        .from('hiring_stages')
        .select('id')
        .order('order_index')
        .limit(1);
        
      if (stagesError || !stages || stages.length === 0) {
        throw new Error('No hiring stages found');
      }

      // Add to pipeline
      const { data: pipelineEntry, error: pipelineError } = await supabase
        .from('candidate_pipeline')
        .insert({
          candidate_id: candidate.id,
          stage_id: stages[0].id,
          applied_company: data.applied_company,
          applied_job_title: data.applied_job_title,
          is_active: true
        })
        .select()
        .single();

      if (pipelineError) throw pipelineError;

      return { candidate, pipelineEntry };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['candidates-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['hiring-stages'] });
      toast.success('Candidate created and added to pipeline successfully');
      
      // Reset form
      setFormData({
        full_name: '',
        applied_company: '',
        applied_job_title: ''
      });
      
      onCandidateCreated?.(data.candidate);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to create candidate: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim()) {
      toast.error('Please enter the candidate name');
      return;
    }
    
    if (!formData.applied_company.trim()) {
      toast.error('Please enter the applied company');
      return;
    }
    
    if (!formData.applied_job_title.trim()) {
      toast.error('Please enter the applied job title');
      return;
    }

    createMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Create New Candidate
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Candidate Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              placeholder="Enter candidate's full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="applied_company">Applied Company *</Label>
            <Input
              id="applied_company"
              value={formData.applied_company}
              onChange={(e) => handleInputChange('applied_company', e.target.value)}
              placeholder="Enter company they applied to"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="applied_job_title">Applied Job Title *</Label>
            <Input
              id="applied_job_title"
              value={formData.applied_job_title}
              onChange={(e) => handleInputChange('applied_job_title', e.target.value)}
              placeholder="Enter job title they applied for"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create & Add to Pipeline
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};