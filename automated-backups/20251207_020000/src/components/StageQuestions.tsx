
// ABOUTME: Component for displaying practice questions organized by category
// ABOUTME: Groups questions into sections like the learning resources

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Settings2 } from "lucide-react";
import QuestionCard from "./QuestionCard";
import { useEffect, useState } from "react";
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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };
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

  // Expand all categories by default when questions are loaded
  useEffect(() => {
    if (questions && questions.length > 0) {
      const allCategories = Object.keys(questionsByCategory);
      setExpandedCategories(prev => {
        // Only update if the categories have actually changed
        const newCategories = new Set(allCategories);
        if (prev.size !== newCategories.size || !allCategories.every(cat => prev.has(cat))) {
          return newCategories;
        }
        return prev;
      });
    }
  }, [questions]);

  const handleRemoveFromStage = (questionId: string) => {
    // Trigger questions update to refresh the view
    if (onQuestionsUpdate) {
      onQuestionsUpdate();
    }
  };

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Practice Questions</CardTitle>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={onManageClick}
              className="text-sm border-border hover:bg-muted"
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Manage Questions
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {questions && questions.length > 0 ? (
          <Accordion 
            type="single" 
            className="w-full"
            collapsible
          >
            {Object.entries(questionsByCategory).map(([category, categoryQuestions]) => {
              const isExpanded = expandedCategories.has(category);
              const displayedQuestions = isExpanded ? categoryQuestions : categoryQuestions.slice(0, 6);
              const hasMore = categoryQuestions.length > 6;

              return (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="text-left hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{category}</Badge>
                      <span className="text-sm text-muted-foreground">({categoryQuestions.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4">
                      {displayedQuestions.map((question) => (
                        <QuestionCard 
                          key={question.id} 
                          question={question} 
                          stageId={stageId}
                          onRemoveFromStage={handleRemoveFromStage}
                        />
                      ))}
                    </div>
                    {hasMore && !isExpanded && (
                      <div className="flex justify-center mt-6">
                        <Button
                          variant="outline"
                          onClick={() => toggleCategoryExpansion(category)}
                          className="border-border hover:bg-muted"
                        >
                          View More ({categoryQuestions.length - 6} more)
                        </Button>
                      </div>
                    )}
                    {hasMore && isExpanded && (
                      <div className="flex justify-center mt-6">
                        <Button
                          variant="outline"
                          onClick={() => toggleCategoryExpansion(category)}
                          className="border-border hover:bg-muted"
                        >
                          Show Less
                        </Button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No questions assigned to this stage yet.</p>
            {isAdmin && (
              <Button
                variant="outline"
                onClick={onManageClick}
                className="border-border hover:bg-muted"
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
