
import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { 
  User, 
  Building2, 
  Briefcase, 
  Mail,
  UserX
} from 'lucide-react';

interface CandidateCardProps {
  candidate: any;
  isDragging?: boolean;
  onClick?: () => void;
  showInactive?: boolean;
}

export const CandidateCard = memo(({ candidate, isDragging, onClick, showInactive = false }: CandidateCardProps) => {
  const isTemporaryEmail = candidate.email?.includes('@pipeline.temp');
  const hasRealEmail = candidate.email && !isTemporaryEmail;

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        isDragging && "opacity-50 rotate-3",
        !hasRealEmail && "border-l-4 border-l-orange-400 bg-orange-50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarFallback className={cn(
              "text-white font-medium",
              hasRealEmail ? "bg-blue-500" : "bg-orange-500"
            )}>
              {hasRealEmail ? (
                <User className="w-5 h-5" />
              ) : (
                <UserX className="w-5 h-5" />
              )}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gray-900 truncate">
                {candidate.full_name || 'Unnamed Candidate'}
              </h3>
              {!hasRealEmail && (
                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                  Pipeline Only
                </Badge>
              )}
            </div>
            
            {hasRealEmail && (
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                <Mail className="w-3 h-3" />
                <span className="truncate">{candidate.email}</span>
              </div>
            )}
            
            <div className="space-y-1">
              {candidate.current_company && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Building2 className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{candidate.current_company}</span>
                </div>
              )}
              
              {candidate.applied_company && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Briefcase className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{candidate.applied_company}</span>
                </div>
              )}
              
              {candidate.applied_job_title && (
                <div className="text-sm text-gray-500 truncate">
                  {candidate.applied_job_title}
                </div>
              )}
            </div>
            
            {candidate.years_of_experience && (
              <div className="text-xs text-gray-500 mt-2">
                {candidate.years_of_experience} years exp.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

CandidateCard.displayName = 'CandidateCard';
