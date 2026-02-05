// ABOUTME: Displays an AI-generated summary for a course stage
// ABOUTME: Auto-generates on first view, regenerates only when content changes

import { memo, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface StageSummaryData {
  id: string;
  stage_id: string;
  tldr_points: string[];
  testing_focus_quote: string | null;
  testing_focus_points: string[];
  common_pitfalls: string[];
  content_hash: string | null;
  updated_at: string;
}

interface StageSummaryProps {
  stageId: string;
  stageTitle: string;
  stageDescription: string | null;
  stageInformation: string | null;
}

export const StageSummary = memo(({ 
  stageId, 
  stageTitle,
  stageDescription,
  stageInformation,
}: StageSummaryProps) => {
  const queryClient = useQueryClient();
  const hasTriggeredGeneration = useRef(false);

  // Fetch existing summary
  const { data: summary, isLoading, isFetched } = useQuery({
    queryKey: ['stage-summary', stageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stage_summaries')
        .select('*')
        .eq('stage_id', stageId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching stage summary:', error);
        return null;
      }
      
      return data as StageSummaryData | null;
    },
    enabled: !!stageId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Auto-generate summary when stage is viewed and no summary exists
  // The Edge Function handles content hash comparison for regeneration
  useEffect(() => {
    if (!isFetched || hasTriggeredGeneration.current) return;
    if (!stageId || !stageInformation) return; // Don't generate if no content

    // Trigger generation (Edge Function will return cached if content unchanged)
    const generateSummary = async () => {
      hasTriggeredGeneration.current = true;
      try {
        const { data, error } = await supabase.functions.invoke('generate-stage-summary', {
          body: { stage_id: stageId, force: false },
        });

        if (error) {
          console.error('Error generating summary:', error);
          return;
        }

        // Only invalidate if new content was generated
        if (data.generated) {
          queryClient.invalidateQueries({ queryKey: ['stage-summary', stageId] });
          queryClient.invalidateQueries({ queryKey: ['stage-summary-exists', stageId] });
        }
      } catch (err) {
        console.error('Error calling generate-stage-summary:', err);
      }
    };

    generateSummary();
  }, [stageId, stageInformation, isFetched, queryClient]);

  // Reset generation flag when stage changes
  useEffect(() => {
    hasTriggeredGeneration.current = false;
  }, [stageId]);

  // Show loading state while generating for the first time
  if (isLoading || (!summary && stageInformation && !hasTriggeredGeneration.current)) {
    return (
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Generating summary...</span>
      </div>
    );
  }

  // No summary and no content to generate from
  if (!summary) {
    return null;
  }

  const hasTldr = summary.tldr_points && summary.tldr_points.length > 0;
  const hasTestingFocus = summary.testing_focus_quote || (summary.testing_focus_points && summary.testing_focus_points.length > 0);
  const hasPitfalls = summary.common_pitfalls && summary.common_pitfalls.length > 0;

  if (!hasTldr && !hasTestingFocus && !hasPitfalls) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* TL;DR Section */}
      {hasTldr && (
        <div className="mb-5 bg-gray-50 rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              At a Glance (TL;DR)
            </h4>
          </div>
          <ul className="space-y-3">
            {summary.tldr_points.map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span 
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatBoldText(point) }}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bottom Two-Column Section */}
      {(hasTestingFocus || hasPitfalls) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
          {/* Interviewer is Looking for */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Interviewer is Looking for...</h4>
            {summary.testing_focus_quote && (
              <p className="text-gray-500 italic text-sm leading-relaxed mb-2">
                "{summary.testing_focus_quote}"
              </p>
            )}
            {summary.testing_focus_points && summary.testing_focus_points.length > 0 && (
              <ul className="space-y-1.5">
                {summary.testing_focus_points.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0 mt-2"></span>
                    <span className="text-sm text-gray-600">{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Common Pitfalls */}
          <div>
            <h4 className="text-sm font-semibold text-red-600 mb-2">Common Pitfalls</h4>
            {hasPitfalls && (
              <ul className="space-y-1.5">
                {summary.common_pitfalls.map((pitfall, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-2"></span>
                    <span className="text-sm text-gray-600">{pitfall}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

StageSummary.displayName = 'StageSummary';

// Helper function to format bold text (words between ** markers)
function formatBoldText(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
}
