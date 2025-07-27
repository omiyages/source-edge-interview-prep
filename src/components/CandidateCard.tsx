
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Building, Calendar, User, Eye, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/formatters';
import { useMakeCandidateInactive } from '@/hooks/useCandidateInactive';

interface CandidateCardProps {
  candidate: any;
  isDragging?: boolean;
  showInactive?: boolean;
}

export const CandidateCard = ({ 
  candidate, 
  isDragging = false,
  showInactive = false 
}: CandidateCardProps) => {
  const makeCandidateInactive = useMakeCandidateInactive();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDraggingState,
  } = useDraggable({
    id: candidate.applicationId || candidate.id,
    data: {
      candidate,
      type: 'candidate',
    },
    disabled: candidate.is_active === false, // Disable dragging for inactive candidates
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const handleMakeInactive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (candidate.applicationId) {
      makeCandidateInactive.mutate({ applicationId: candidate.applicationId });
    }
  };

  const isInactive = candidate.is_active === false;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-move transition-all duration-200 hover:shadow-md",
        isDragging && "opacity-50 rotate-2 scale-105",
        isDraggingState && "z-50",
        isInactive && "opacity-60 bg-muted/50 border-dashed"
      )}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {candidate.full_name 
                  ? candidate.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                  : candidate.email.slice(0, 2).toUpperCase()
                }
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium text-sm">
                {candidate.full_name || candidate.email}
              </h4>
              <p className="text-xs text-muted-foreground">
                {candidate.email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {isInactive && (
              <Badge variant="secondary" className="text-xs">
                Inactive
              </Badge>
            )}
            {candidate.is_active !== false && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMakeInactive}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                disabled={makeCandidateInactive.isPending}
              >
                <UserX className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2 text-xs">
          {candidate.applied_company && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building className="h-3 w-3" />
              <span>{candidate.applied_company}</span>
            </div>
          )}
          
          {candidate.applied_job_title && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{candidate.applied_job_title}</span>
            </div>
          )}
          
          {candidate.current_company && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building className="h-3 w-3" />
              <span>Currently at {candidate.current_company}</span>
            </div>
          )}
          
          {candidate.moved_at && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Moved {formatDate(candidate.moved_at)}</span>
            </div>
          )}
        </div>

        {candidate.skillsets && candidate.skillsets.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {candidate.skillsets.slice(0, 3).map((skill: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {candidate.skillsets.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{candidate.skillsets.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
