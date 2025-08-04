
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, UserPlus, Building, Phone, Mail, MapPin } from 'lucide-react';
import { ConvertCandidateToUserDialog } from './ConvertCandidateToUserDialog';
import type { Candidate } from '@/hooks/useKanbanData';

interface CandidateCardProps {
  candidate: Candidate;
  isDragging?: boolean;
  showInactive?: boolean;
  onClick?: () => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({ 
  candidate, 
  isDragging = false, 
  showInactive = false,
  onClick
}) => {
  const [showConvertDialog, setShowConvertDialog] = useState(false);

  const handleConvertSuccess = () => {
    setShowConvertDialog(false);
    // The query will be invalidated by the dialog component
  };

  return (
    <>
      <Card className={`w-full mb-3 hover:shadow-md transition-shadow cursor-pointer bg-card ${isDragging ? 'opacity-50' : ''}`} onClick={onClick}>
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
            
            {!candidate.is_user && (
              <Button
                variant="outline"
                size="sm"
                className="ml-2 h-7 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConvertDialog(true);
                }}
              >
                <UserPlus className="w-3 h-3" />
              </Button>
            )}
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
      />
    </>
  );
};
