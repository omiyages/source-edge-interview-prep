// ABOUTME: Admin editor for stage summaries
// ABOUTME: Allows manual editing and AI generation of stage TL;DR content

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Plus, X, Save, Loader2 } from 'lucide-react';

interface StageSummaryEditorProps {
  stageId: string;
  stageTitle: string;
  stageInformation: string | null;
  onClose: () => void;
}

export const StageSummaryEditor = ({ 
  stageId, 
  stageTitle, 
  stageInformation,
  onClose 
}: StageSummaryEditorProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [tldrPoints, setTldrPoints] = useState<string[]>(['']);
  const [testingFocusQuote, setTestingFocusQuote] = useState('');
  const [testingFocusPoints, setTestingFocusPoints] = useState<string[]>(['']);
  const [commonPitfalls, setCommonPitfalls] = useState<string[]>(['']);

  // Fetch existing summary
  const { data: existingSummary, isLoading } = useQuery({
    queryKey: ['stage-summary', stageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stage_summaries')
        .select('*')
        .eq('stage_id', stageId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data;
    },
  });

  // Populate form with existing data
  useEffect(() => {
    if (existingSummary) {
      setTldrPoints(existingSummary.tldr_points?.length > 0 ? existingSummary.tldr_points : ['']);
      setTestingFocusQuote(existingSummary.testing_focus_quote || '');
      setTestingFocusPoints(existingSummary.testing_focus_points?.length > 0 ? existingSummary.testing_focus_points : ['']);
      setCommonPitfalls(existingSummary.common_pitfalls?.length > 0 ? existingSummary.common_pitfalls : ['']);
    }
  }, [existingSummary]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const summaryData = {
        stage_id: stageId,
        tldr_points: tldrPoints.filter(p => p.trim()),
        testing_focus_quote: testingFocusQuote.trim() || null,
        testing_focus_points: testingFocusPoints.filter(p => p.trim()),
        common_pitfalls: commonPitfalls.filter(p => p.trim()),
      };

      if (existingSummary) {
        const { error } = await supabase
          .from('stage_summaries')
          .update(summaryData)
          .eq('id', existingSummary.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('stage_summaries')
          .insert(summaryData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stage-summary', stageId] });
      toast({
        title: 'Summary Saved',
        description: 'The stage summary has been updated successfully.',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save summary.',
        variant: 'destructive',
      });
    },
  });

  // Helper functions for managing arrays
  const addItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => [...prev, '']);
  };

  const removeItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number, value: string) => {
    setter(prev => prev.map((item, i) => i === index ? value : item));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
        <p className="text-sm text-blue-700">
          <strong>Tip:</strong> Use <code className="bg-blue-100 px-1 rounded">**bold text**</code> to highlight key terms in TL;DR points.
        </p>
      </div>

      {/* TL;DR Points */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">At a Glance (TL;DR) Points</Label>
        <p className="text-xs text-muted-foreground">3-4 key takeaways for this stage</p>
        {tldrPoints.map((point, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={point}
              onChange={(e) => updateItem(setTldrPoints, index, e.target.value)}
              placeholder="e.g., Interviewers value **Resource Management** over brute-force efficiency."
              className="flex-1"
            />
            {tldrPoints.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeItem(setTldrPoints, index)}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => addItem(setTldrPoints)}>
          <Plus className="w-4 h-4 mr-1" /> Add Point
        </Button>
      </div>

      {/* Testing Focus Quote */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Real Testing Focus - Quote</Label>
        <p className="text-xs text-muted-foreground">An insightful quote about what interviewers really look for</p>
        <Textarea
          value={testingFocusQuote}
          onChange={(e) => setTestingFocusQuote(e.target.value)}
          placeholder="e.g., They aren't just checking if it works, they're checking if it's deterministic and safe for automotive-grade deployment."
          rows={2}
        />
      </div>

      {/* Testing Focus Points */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Real Testing Focus - Points (Optional)</Label>
        <p className="text-xs text-muted-foreground">Additional skills being evaluated</p>
        {testingFocusPoints.map((point, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={point}
              onChange={(e) => updateItem(setTestingFocusPoints, index, e.target.value)}
              placeholder="e.g., Problem decomposition skills"
              className="flex-1"
            />
            {testingFocusPoints.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeItem(setTestingFocusPoints, index)}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => addItem(setTestingFocusPoints)}>
          <Plus className="w-4 h-4 mr-1" /> Add Point
        </Button>
      </div>

      {/* Common Pitfalls */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Common Pitfalls</Label>
        <p className="text-xs text-muted-foreground">Frequent mistakes candidates make</p>
        {commonPitfalls.map((pitfall, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={pitfall}
              onChange={(e) => updateItem(setCommonPitfalls, index, e.target.value)}
              placeholder="e.g., Overusing STL in restricted environments"
              className="flex-1"
            />
            {commonPitfalls.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeItem(setCommonPitfalls, index)}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => addItem(setCommonPitfalls)}>
          <Plus className="w-4 h-4 mr-1" /> Add Pitfall
        </Button>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Summary
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
