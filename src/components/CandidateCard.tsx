
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ExternalLink, Mail, Building2, X, Briefcase, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRemoveCandidateFromPipelineMutation, useDeleteCandidateCompletely } from '@/hooks/useKanbanMutations';

interface Candidate {
  id: string;
  email: string;
  full_name: string | null;
  linkedin_profile: string | null;
  current_company: string | null;
  years_of_experience: number | null;
  skillsets: string[] | null;
  applicationId?: string;
  applied_company?: string | null;
  applied_job_title?: string | null;
}

interface CandidateCardProps {
  candidate: Candidate;
  isDragging?: boolean;
  dragId?: string;
  isUnassigned?: boolean;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  isDragging = false,
  dragId,
  isUnassigned = false,
}) => {
  const removeCandidateFromPipelineMutation = useRemoveCandidateFromPipelineMutation();
  const deleteCandidateCompletelyMutation = useDeleteCandidateCompletely();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: dragId || candidate.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  const displayName = candidate.full_name || candidate.email.split('@')[0];
  
  // Function to get company icon based on applied company
  const getCompanyIcon = (companyName?: string | null) => {
    if (!companyName) return displayName.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2);
    
    const company = companyName.toLowerCase();
    if (company.includes('woven')) return 'Woven';
    if (company.includes('wismettac')) return 'Wis';
    if (company.includes('lexxpluss')) return 'LP';
    
    // For other companies, use first two letters
    return companyName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const companyIcon = getCompanyIcon(candidate.applied_company);

  const handleRemoveFromPipeline = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🗑️ Remove from pipeline button clicked for candidate:', {
      candidateId: candidate.id,
      applicationId: candidate.applicationId,
      email: candidate.email,
      isUnassigned
    });
    
    if (candidate.applicationId) {
      console.log('🔄 Removing candidate from pipeline with applicationId:', candidate.applicationId);
      removeCandidateFromPipelineMutation.mutate({ applicationId: candidate.applicationId });
    } else {
      console.log('🚫 No applicationId found, cannot remove from pipeline');
      toast.error('Cannot remove candidate - no pipeline entry found');
    }
  };

  const handleDeleteCompletely = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🗑️ Delete completely button clicked for candidate:', {
      candidateId: candidate.id,
      email: candidate.email,
      isUnassigned
    });
    
    if (window.confirm(`Are you sure you want to permanently delete ${displayName}? This action cannot be undone and will remove the user entirely from the system.`)) {
      console.log('🔄 Proceeding with complete deletion of candidate:', candidate.id);
      deleteCandidateCompletelyMutation.mutate({ candidateId: candidate.id });
    }
  };

  // Determine which buttons to show based on the candidate's state
  const hasApplicationId = Boolean(candidate.applicationId);
  const showRemoveButton = hasApplicationId && !isUnassigned; // Show X for candidates in stages
  const showDeleteButton = isUnassigned || !hasApplicationId; // Show trash for unassigned or candidates not in pipeline

  console.log('🎴 CandidateCard render decision:', {
    email: candidate.email,
    hasApplicationId,
    isUnassigned,
    showRemoveButton,
    showDeleteButton,
    dragId
  });

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
        isDragging || isSortableDragging ? 'shadow-lg ring-2 ring-primary' : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
              {companyIcon}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium text-sm truncate text-foreground">
                {displayName}
              </h4>
              <div className="flex items-center gap-1">
                {candidate.linkedin_profile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(candidate.linkedin_profile!, '_blank');
                    }}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
                {showRemoveButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                    onClick={handleRemoveFromPipeline}
                    title="Remove from pipeline (move to unassigned)"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                {showDeleteButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleDeleteCompletely}
                    title="Delete user permanently"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <Mail className="h-3 w-3" />
              <span className="truncate">{candidate.email}</span>
            </div>

            {/* Applied Company and Job Title */}
            {candidate.applied_company && (
              <div className="flex items-center gap-1 text-xs text-foreground mb-2 bg-primary/10 px-2 py-1 rounded">
                <Briefcase className="h-3 w-3" />
                <span className="truncate font-medium">
                  {candidate.applied_job_title && (
                    <>
                      {candidate.applied_job_title} • 
                    </>
                  )}
                  {candidate.applied_company}
                </span>
              </div>
            )}

            {/* Current Company (if no applied company) */}
            {!candidate.applied_company && candidate.current_company && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <Building2 className="h-3 w-3" />
                <span className="truncate">{candidate.current_company}</span>
              </div>
            )}

            {candidate.years_of_experience && (
              <div className="text-xs text-muted-foreground mb-2">
                {candidate.years_of_experience} years experience
              </div>
            )}

            {candidate.skillsets && candidate.skillsets.length > 0 && (
              <div className="flex flex-wrap gap-1">
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
        </div>
      </CardContent>
    </Card>
  );
};
