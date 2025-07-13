
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ExternalLink, Mail, Building2, X } from 'lucide-react';
import { useRemoveCandidateFromPipelineMutation } from '@/hooks/useKanbanMutations';

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
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  isDragging = false,
  dragId,
}) => {
  const removeCandidateMutation = useRemoveCandidateFromPipelineMutation();

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
  const initials = displayName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleRemoveCandidate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (candidate.applicationId) {
      removeCandidateMutation.mutate({ applicationId: candidate.applicationId });
    }
  };

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
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
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
                {candidate.applicationId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={handleRemoveCandidate}
                    title="Remove from pipeline"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <Mail className="h-3 w-3" />
              <span className="truncate">{candidate.email}</span>
            </div>

            {(candidate.applied_company || candidate.current_company) && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <Building2 className="h-3 w-3" />
                <span className="truncate">
                  {candidate.applied_company ? (
                    <>
                      <span className="font-medium">{candidate.applied_company}</span>
                      {candidate.applied_job_title && (
                        <span className="text-muted-foreground"> • {candidate.applied_job_title}</span>
                      )}
                    </>
                  ) : (
                    candidate.current_company
                  )}
                </span>
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
