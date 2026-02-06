
// ABOUTME: Component for displaying practice questions organized by category
// ABOUTME: Groups questions into sections like the learning resources

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2, Search, Filter } from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { stripHtml } from "@/utils/htmlSanitizer";
import { QuestionDetailDialog } from "@/components/QuestionDetailDialog";
import type { InterviewQuestion as ServiceInterviewQuestion } from "@/services/questionsService";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("newest");
  const [displayedCount, setDisplayedCount] = useState(6);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  // Debounce timer ref for real-time updates
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Set up real-time subscription for stage questions with debouncing
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
          // Debounce the update to prevent rapid refetches
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          debounceTimerRef.current = setTimeout(() => {
            onQuestionsUpdate();
          }, 300);
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription for stage questions');
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [stageId, onQuestionsUpdate]);

  // Get unique categories
  const uniqueCategories = useMemo(() => {
    if (!questions) return [];
    const categories = new Set(questions.map(q => q.category).filter(Boolean));
    return Array.from(categories);
  }, [questions]);

  // Filter and sort questions
  const filteredAndSortedQuestions = useMemo(() => {
    if (!questions) return [];
    
    let filtered = questions.filter(q => {
      const matchesSearch = !searchTerm || 
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.additional_context?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "ALL" || 
        q.category?.toUpperCase() === selectedCategory.toUpperCase();
      
      return matchesSearch && matchesCategory;
    });

    // Sort questions
    if (sortOrder === "newest") {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortOrder === "oldest") {
      filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    return filtered;
  }, [questions, searchTerm, selectedCategory, sortOrder]);

  const totalQuestions = questions?.length || 0;
  const displayedQuestions = filteredAndSortedQuestions.slice(0, displayedCount);
  const hasMore = filteredAndSortedQuestions.length > displayedCount;

  const getCategoryColor = (category: string) => {
    const cat = category?.toUpperCase() || "";
    if (cat.includes("TECH") || cat.includes("TECHNICAL")) return "bg-orange-100 text-orange-700 border-orange-200";
    if (cat.includes("BEHAVIORAL")) return "bg-teal-100 text-teal-700 border-teal-200";
    if (cat.includes("SYSTEM") || cat.includes("DESIGN")) return "bg-purple-100 text-purple-700 border-purple-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-foreground">Practice Questions</h2>
          {totalQuestions > 0 && (
            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
              {totalQuestions} Total
            </Badge>
          )}
        </div>
          {isAdmin && (
            <Button
            variant="ghost"
              size="sm"
              onClick={onManageClick}
            className="text-muted-foreground hover:text-foreground"
            >
              <Settings2 className="w-4 h-4 mr-2" />
            Manage
            </Button>
          )}
        </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-border space-y-4">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("ALL")}
            className={`rounded-lg ${selectedCategory === "ALL" ? "bg-primary text-primary-foreground" : ""}`}
          >
            All
          </Button>
          {uniqueCategories.map((category) => {
            const categoryKey = category.toUpperCase();
            // Format category for display (Title Case)
            const displayName = category
              .split(/[-_\s]+/)
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
            return (
              <Button
                key={category}
                variant={selectedCategory === categoryKey ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(categoryKey)}
                className={`rounded-lg ${selectedCategory === categoryKey ? "bg-primary text-primary-foreground" : ""}`}
              >
                {displayName}
              </Button>
            );
          })}
        </div>

        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

          {/* Questions Grid */}
      {displayedQuestions.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayedQuestions.map((question, index) => (
              <Card key={question.id} className="bg-white border-border shadow-sm hover:shadow-md transition-shadow h-full">
                <CardContent className="p-4 h-full flex flex-col">
                  {/* Category Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={`text-xs font-medium ${getCategoryColor(question.category)}`}>
                      {question.category || "Technical"}
                    </Badge>
                  </div>
                  
                  {/* Question Title - Fixed height area */}
                  <h3 className="font-semibold text-sm mb-2 text-foreground line-clamp-2 min-h-[2.5rem]">
                    {question.question}
                  </h3>
                  
                  {/* Description - Flexible area */}
                  <div className="flex-1 min-h-[4.5rem]">
                    {question.additional_context && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {stripHtml(question.additional_context)}
                      </p>
                    )}
                  </div>
                  
                  {/* Footer - Always at bottom */}
                  <div className="flex items-center justify-between pt-4 mt-auto border-t border-border/50">
                    <span className="text-xs text-muted-foreground">{question.company}</span>
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => setSelectedQuestionIndex(index)}
                    >
                      View Question
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
                        <Button
                          variant="outline"
                onClick={() => setDisplayedCount(prev => prev + 6)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700"
                        >
                Load More Questions
                        </Button>
                      </div>
                    )}
        </>
        ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-border">
          <p className="text-muted-foreground mb-4">No questions found matching your filters.</p>
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

      <QuestionDetailDialog
        open={selectedQuestionIndex !== null}
        onOpenChange={(open) => !open && setSelectedQuestionIndex(null)}
        question={
          selectedQuestionIndex !== null
            ? (displayedQuestions[selectedQuestionIndex] as ServiceInterviewQuestion)
            : null
        }
        currentDisplayNumber={selectedQuestionIndex !== null ? selectedQuestionIndex + 1 : 1}
        totalCount={displayedQuestions.length}
        onPrev={() => {
          if (selectedQuestionIndex !== null && selectedQuestionIndex > 0) {
            setSelectedQuestionIndex(selectedQuestionIndex - 1);
          }
        }}
        onNext={() => {
          if (
            selectedQuestionIndex !== null &&
            selectedQuestionIndex < displayedQuestions.length - 1
          ) {
            setSelectedQuestionIndex(selectedQuestionIndex + 1);
          }
        }}
        canPrev={selectedQuestionIndex !== null && selectedQuestionIndex > 0}
        canNext={
          selectedQuestionIndex !== null &&
          selectedQuestionIndex < displayedQuestions.length - 1
        }
      />
    </div>
  );
};
