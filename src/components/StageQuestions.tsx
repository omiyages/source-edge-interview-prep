
// ABOUTME: Component for displaying practice questions organized by category
// ABOUTME: Groups questions into sections like the learning resources

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import QuestionCard from "./QuestionCard";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface InterviewQuestion {
  id: string;
  question: string;
  company: string;
  role: string;
  interview_stage: string;
  category: string;
  submitted_by: string | null;
  additional_context: string | null;
  created_at: string;
  question_type: string;
  source_url: string | null;
  source_website: string | null;
  scraped_at: string | null;
  team: string | null;
  position_name: string | null;
}

interface StageQuestionsProps {
  questions: InterviewQuestion[] | undefined;
  isAdmin: boolean;
  onManageClick: () => void;
  stageId?: string;
  onQuestionsUpdate?: () => void;
}

export const StageQuestions = ({ 
  questions, 
  isAdmin, 
  onManageClick, 
  stageId,
  onQuestionsUpdate 
}: StageQuestionsProps) => {
  // Set up real-time subscription for stage questions
  useEffect(() => {
    if (!stageId || !onQuestionsUpdate) return;

    console.log('Setting up real-time subscription for stage questions:', stageId);

    const channel = supabase
      .channel(`stage-questions-${stageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stage_questions',
          filter: `stage_id=eq.${stageId}`
        },
        (payload) => {
          console.log('Stage questions changed:', payload);
          onQuestionsUpdate();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription for stage questions');
      supabase.removeChannel(channel);
    };
  }, [stageId, onQuestionsUpdate]);

  // Group questions by category
  const questionsByCategory = questions?.reduce((acc, question) => {
    const category = question.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(question);
    return acc;
  }, {} as Record<string, InterviewQuestion[]>) || {};

  return (
    <Card className="border-gray-200 bg-white shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Practice Questions</CardTitle>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={onManageClick}
              className="text-sm border-gray-300 hover:bg-gray-50"
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Manage Questions
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {questions && questions.length > 0 ? (
          <div className="space-y-8">
            {Object.entries(questionsByCategory).map(([category, categoryQuestions]) => (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-gray-900">{category}</h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    ({categoryQuestions.length})
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categoryQuestions.map((question) => (
                    <QuestionCard 
                      key={question.id} 
                      question={question} 
                      hideDelete={true}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No questions assigned to this stage yet.</p>
            {isAdmin && (
              <Button
                variant="outline"
                onClick={onManageClick}
                className="border-gray-300 hover:bg-gray-50"
              >
                <Settings2 className="w-4 h-4 mr-2" />
                Add Questions
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
