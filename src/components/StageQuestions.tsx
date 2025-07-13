
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

    const channel = supabase
      .channel('stage-questions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stage_questions',
          filter: `stage_id=eq.${stageId}`
        },
        () => {
          console.log('Stage questions changed, refetching...');
          onQuestionsUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [stageId, onQuestionsUpdate]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Practice Questions</CardTitle>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={onManageClick}
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Manage Questions
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {questions && questions.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {questions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No questions assigned to this stage yet.</p>
            {isAdmin && (
              <Button
                variant="outline"
                onClick={onManageClick}
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
