import React, { useState } from "react";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { StageSummary } from "@/components/StageSummary";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StageInformationProps {
  information: string | null;
  stageTitle?: string;
  stageId?: string;
  stageDescription?: string | null;
  children?: React.ReactNode;
}

export const StageInformation = ({ 
  information, 
  stageTitle, 
  stageId,
  stageDescription,
  children 
}: StageInformationProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if summary exists for the badge
  const { data: hasSummary } = useQuery({
    queryKey: ['stage-summary-exists', stageId],
    queryFn: async () => {
      if (!stageId) return false;
      const { data } = await supabase
        .from('stage_summaries')
        .select('id')
        .eq('stage_id', stageId)
        .single();
      return !!data;
    },
    enabled: !!stageId,
  });

  if (!information) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm h-full">
        {stageId && (
          <StageSummary 
            stageId={stageId}
            stageTitle={stageTitle || 'Stage'}
            stageDescription={stageDescription || null}
            stageInformation={information}
          />
        )}
        <div className="text-center py-8 text-muted-foreground">
          <p>No information available for this stage.</p>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm h-full flex flex-col">
      {/* Header with title and AI badge */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-semibold text-gray-900">
          Stage Information: {stageTitle || 'Stage'}
        </h3>
        {hasSummary && (
          <Badge className="bg-primary/10 text-primary border-0 px-2.5 py-1 text-xs font-medium flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            Summarized by AI
          </Badge>
        )}
      </div>
      
      {/* Stage description subtitle */}
      {stageDescription && (
        <p className="text-sm text-gray-500 mb-4">{stageDescription}</p>
      )}
      
      {/* AI Summary Section */}
      {stageId && (
        <StageSummary 
          stageId={stageId}
          stageTitle={stageTitle || 'Stage'}
          stageDescription={stageDescription || null}
          stageInformation={information}
        />
      )}
      
      {/* Collapsible Detailed Content */}
      <div className="flex-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-3 px-4 bg-primary/5 border border-primary/20 rounded-xl text-primary hover:bg-primary/10 hover:border-primary/30 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
          View Detailed Explanation
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <RichTextDisplay content={information} />
          </div>
        )}
      </div>
      
      {children && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
};
