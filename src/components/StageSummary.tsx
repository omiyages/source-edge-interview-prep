// ABOUTME: Displays an AI-generated summary for a course stage
// ABOUTME: Shows TL;DR points, testing focus, and common pitfalls

import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StageSummaryData {
  id: string;
  stage_id: string;
  tldr_points: string[];
  testing_focus_quote: string | null;
  testing_focus_points: string[];
  common_pitfalls: string[];
  updated_at: string;
}

interface StageSummaryProps {
  stageId: string;
  isAdmin?: boolean;
  onGenerateSummary?: () => void;
}

export const StageSummary = memo(({ stageId, isAdmin, onGenerateSummary }: StageSummaryProps) => {
  const { data: summary, isLoading } = useQuery({
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
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 animate-pulse">
        <div className="h-6 bg-gray-100 rounded w-48 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-100 rounded w-full"></div>
          <div className="h-4 bg-gray-100 rounded w-5/6"></div>
          <div className="h-4 bg-gray-100 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  // No summary exists yet
  if (!summary) {
    if (isAdmin) {
      return (
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl border border-gray-200 border-dashed p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Stage Summary</h3>
                <p className="text-sm text-gray-500">Generate an AI summary for this stage</p>
              </div>
            </div>
            <Button onClick={onGenerateSummary} className="rounded-xl">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Summary
            </Button>
          </div>
        </div>
      );
    }
    return null; // Don't show anything to non-admins if no summary
  }

  const hasTldr = summary.tldr_points && summary.tldr_points.length > 0;
  const hasTestingFocus = summary.testing_focus_quote || (summary.testing_focus_points && summary.testing_focus_points.length > 0);
  const hasPitfalls = summary.common_pitfalls && summary.common_pitfalls.length > 0;

  if (!hasTldr && !hasTestingFocus && !hasPitfalls) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
      {/* TL;DR Section */}
      {hasTldr && (
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              At a Glance (TL;DR)
            </h3>
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
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {/* Real Testing Focus */}
          <div className="p-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Real Testing Focus</h4>
            {summary.testing_focus_quote && (
              <p className="text-gray-500 italic text-sm leading-relaxed mb-3">
                "{summary.testing_focus_quote}"
              </p>
            )}
            {summary.testing_focus_points && summary.testing_focus_points.length > 0 && (
              <ul className="space-y-2">
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
          <div className="p-6">
            <h4 className="text-sm font-semibold text-red-600 mb-3">Common Pitfalls</h4>
            {hasPitfalls && (
              <ul className="space-y-2">
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

      {/* Admin Edit Option */}
      {isAdmin && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Last updated: {new Date(summary.updated_at).toLocaleDateString()}
          </span>
          <Button variant="ghost" size="sm" onClick={onGenerateSummary} className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            Regenerate
          </Button>
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
