import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, UserPlus, Building, Phone, Mail, X } from 'lucide-react';
import { ConvertCandidateToUserDialog } from './ConvertCandidateToUserDialog';
import { EditableCompanyJobFields } from '@/components/ui/editable-company-job-fields';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { StageCandidate } from '@/hooks/useKanbanStageData';

interface EditableCandidateCardProps {
  candidate: StageCandidate;
  isDragging?: boolean;
  showInactive?: boolean;
  onClick?: () => void;
  onDelete?: (candidateId: string) => void;
}

export const EditableCandidateCard: React.FC<EditableCandidateCardProps> = ({ 
  candidate, 
  isDragging = false, 
  showInactive = false,
  onClick,
  onDelete
}) => {
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const queryClient = useQueryClient();

  const updatePipelineMutation = useMutation({
    mutationFn: async ({ company, jobTitle }: { company?: string; jobTitle?: string }) => {
      if (!candidate.pipeline_id) return;
      
      const updateData: any = {};
      if (company !== undefined) updateData.applied_company = company;
      if (jobTitle !== undefined) updateData.applied_job_title = jobTitle;

      const { error } = await supabase
        .from('candidate_pipeline')
        .update(updateData)
        .eq('id', candidate.pipeline_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates-pipeline'] });
      toast.success('Pipeline details updated');
    },
    onError: (error: any) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const handleConvertSuccess = () => {
    setShowConvertDialog(false);
    // The query will be invalidated by the dialog component
  };

  const handlePipelineUpdate = async (updates: { company?: string; jobTitle?: string }) => {
    return updatePipelineMutation.mutateAsync(updates);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on edit controls
    if ((e.target as HTMLElement).closest('.edit-controls')) {
      e.stopPropagation();
      return;
    }
    onClick?.();
  };

  return (
    <>
      <Card 
        className={`w-full mb-3 hover:shadow-md transition-shadow cursor-pointer bg-card ${isDragging ? 'opacity-50' : ''}`} 
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-card-foreground text-sm">
                  {candidate.full_name || 'Unnamed Candidate'}
                </h3>
                {candidate.is_user && (
                  <div className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              
              {candidate.current_company && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Building className="w-3 h-3" />
                  <span>{candidate.current_company}</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-1 edit-controls">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(candidate.id);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
              {!candidate.is_user && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConvertDialog(true);
                  }}
                >
                  <UserPlus className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {candidate.email && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="w-3 h-3" />
                <span className="truncate">{candidate.email}</span>
              </div>
            )}
            
            {candidate.phone_number && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="w-3 h-3" />
                <span>{candidate.phone_number}</span>
              </div>
            )}
            
            {candidate.years_of_experience && (
              <div className="text-xs text-muted-foreground">
                {candidate.years_of_experience} years experience
              </div>
            )}

            <EditableCompanyJobFields
              appliedCompany={candidate.applied_company || ''}
              appliedJobTitle={candidate.applied_job_title || ''}
              onUpdate={handlePipelineUpdate}
              isUpdating={updatePipelineMutation.isPending}
            />
            
            {candidate.skillsets && candidate.skillsets.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {candidate.skillsets.slice(0, 3).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                    {skill}
                  </Badge>
                ))}
                {candidate.skillsets.length > 3 && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    +{candidate.skillsets.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {candidate.notes && (
            <div className="mt-3 p-2 bg-muted rounded text-xs text-muted-foreground">
              {candidate.notes}
            </div>
          )}
        </CardContent>
      </Card>

      <ConvertCandidateToUserDialog
        open={showConvertDialog}
        onOpenChange={setShowConvertDialog}
        candidate={candidate}
        onSuccess={handleConvertSuccess}
      />
    </>
  );
};