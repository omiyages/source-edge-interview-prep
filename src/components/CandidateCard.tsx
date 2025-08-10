
// ABOUTME: Card component for displaying candidate information in the kanban board
// ABOUTME: Handles drag and drop functionality and candidate detail dialogs

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, DollarSign, Calendar, User, Check, UserPlus } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { CandidateDetailDialog } from './CandidateDetailDialog';
import { ConvertCandidateToUserDialog } from './ConvertCandidateToUserDialog';

interface CandidateCardProps {
  candidate: any;
  isDragging?: boolean;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({ 
  candidate, 
  isDragging = false 
}) => {
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: candidate.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Check if candidate is also a user (has email that matches a profile)
  const isUser = candidate.email && candidate.is_user;

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetailDialog(true);
  };

  const handleConvertClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConvertDialog(true);
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer",
          "hover:border-blue-300 group relative",
          (isDragging || isSortableDragging) && "opacity-50 shadow-lg rotate-2"
        )}
        onClick={handleCardClick}
      >
        {/* User indicator */}
        {isUser && (
          <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 z-10">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
        
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header with name and convert button */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate text-sm">
                  {candidate.full_name}
                </h3>
                {candidate.email && (
                  <p className="text-xs text-gray-500 truncate mt-1">
                    {candidate.email}
                  </p>
                )}
              </div>
              
              {/* Convert to user button - only show if not already a user */}
              {!isUser && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                  onClick={handleConvertClick}
                  title="Convert to User"
                >
                  <UserPlus className="w-4 h-4 text-blue-600" />
                </Button>
              )}
            </div>

            {/* Company and location */}
            {candidate.current_company && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <User className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{candidate.current_company}</span>
              </div>
            )}

            {/* Experience */}
            {candidate.years_of_experience && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span>{candidate.years_of_experience} years exp.</span>
              </div>
            )}

            {/* Salary */}
            {candidate.salary && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <DollarSign className="w-3 h-3 flex-shrink-0" />
                <span>${candidate.salary.toLocaleString()}</span>
              </div>
            )}

            {/* Skills */}
            {candidate.skillsets && candidate.skillsets.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {candidate.skillsets.slice(0, 2).map((skill: string, index: number) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {skill}
                  </Badge>
                ))}
                {candidate.skillsets.length > 2 && (
                  <Badge 
                    variant="outline" 
                    className="text-xs px-2 py-0.5 bg-gray-50 text-gray-600"
                  >
                    +{candidate.skillsets.length - 2}
                  </Badge>
                )}
              </div>
            )}

            {/* Phone number */}
            {candidate.phone_number && (
              <div className="text-xs text-gray-500 truncate">
                📱 {candidate.phone_number}
              </div>
            )}

            {/* Notes preview */}
            {candidate.general_notes && (
              <div className="text-xs text-gray-500 line-clamp-2">
                {candidate.general_notes}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CandidateDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        candidate={candidate}
      />
      
      <ConvertCandidateToUserDialog
        open={showConvertDialog}
        onOpenChange={setShowConvertDialog}
        candidate={candidate}
      />
    </>
  );
};
