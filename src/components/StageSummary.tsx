// ABOUTME: Displays an AI-generated summary for a course stage
// ABOUTME: Shows TL;DR points, testing focus, and common pitfalls

import { memo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

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
  isAdmin?: boolean;
}

export const StageSummary = memo(({ 
  stageId, 
  stageTitle,
  stageDescription,
  stageInformation,
  isAdmin 
}: StageSummaryProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

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

  const generateSummary = async (force: boolean = false) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-stage-summary', {
        body: { stage_id: stageId, force },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: 'Generation Issue',
          description: data.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: data.generated ? 'Summary Generated' : 'Summary Retrieved',
          description: data.generated 
            ? 'AI summary has been created successfully.' 
            : 'Using cached summary.',
        });
        queryClient.invalidateQueries({ queryKey: ['stage-summary', stageId] });
      }
    } catch (err: any) {
      console.error('Error generating summary:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to generate summary.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return null; // Don't show loading state to avoid layout shift
  }

  // No summary exists yet - show generate button for admins
  if (!summary) {
    if (isAdmin) {
      return (
        <div className="mb-6 p-4 bg-gradient-to-r from-primary/5 to-violet-50 rounded-xl border border-primary/10 border-dashed">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-gray-900">AI Summary Available</p>
                <p className="text-sm text-gray-500">Generate a TL;DR for this stage</p>
              </div>
            </div>
            <Button 
              onClick={() => generateSummary(false)} 
              disabled={isGenerating}
              className="rounded-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Summarize by AI
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }
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
      {/* Admin regenerate button */}
      {isAdmin && (
        <div className="flex justify-end mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => generateSummary(true)}
            disabled={isGenerating}
            className="text-xs text-gray-500 hover:text-primary"
          >
            {isGenerating ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3 mr-1" />
            )}
            Regenerate
          </Button>
        </div>
      )}

      {/* TL;DR Section */}
      {hasTldr && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              At a Glance (TL;DR)
            </h4>
          </div>
          <ul className="space-y-2.5">
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
          {/* Real Testing Focus */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Real Testing Focus</h4>
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
