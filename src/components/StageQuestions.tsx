
// ABOUTME: Component for displaying practice questions organized by category
// ABOUTME: Groups questions into sections like the learning resources

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Settings2, ChevronDown } from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(false);
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

  const handleRemoveFromStage = (questionId: string) => {
    // Trigger questions update to refresh the view
    if (onQuestionsUpdate) {
      onQuestionsUpdate();
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2 hover:text-gray-600 transition-colors">
              <CardTitle className="text-lg font-semibold text-gray-900">Practice Questions</CardTitle>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
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
        <CollapsibleContent>
          <CardContent>
            {questions && questions.length > 0 ? (
              <Accordion 
                type="single" 
                defaultValue={Object.keys(questionsByCategory)[0]} 
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
                          <span className="text-sm text-gray-500">({categoryQuestions.length})</span>
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
                              className="border-gray-300 hover:bg-gray-50"
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
                              className="border-gray-300 hover:bg-gray-50"
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
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
