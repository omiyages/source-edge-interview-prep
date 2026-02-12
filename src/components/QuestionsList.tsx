import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import type { InterviewQuestion } from "@/services/questionsService";

interface QuestionsListProps {
  questions: InterviewQuestion[];
  loading: boolean;
  totalCount: number;
  startIndex?: number;
  onSelectQuestion?: (index: number) => void;
}

const QuestionsListItem = memo(({ question, displayNumber, onView }: { question: InterviewQuestion; displayNumber: number; onView?: () => void }) => {
  // For now, we'll use category as difficulty since we don't have a difficulty field
  // You can add difficulty field later if needed
  const getDifficultyColor = (category?: string) => {
    if (!category) return "bg-gray-100 text-gray-700";
    const cat = category.toLowerCase();
    if (cat.includes('behavioral') || cat.includes('easy')) return "bg-green-100 text-green-700";
    if (cat.includes('system') || cat.includes('hard')) return "bg-red-100 text-red-700";
    return "bg-orange-100 text-orange-700";
  };

  const difficultyLabel = question.category || "Medium";
  const difficultyColor = getDifficultyColor(question.category);

  return (
    <div
      id={`question-${question.id}`}
      className="bg-white border border-border rounded-lg p-6 mb-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-sm font-medium text-muted-foreground flex-shrink-0">{displayNumber}.</span>
            <h3 className="text-base font-semibold text-foreground break-words">{question.question}</h3>
            {/* Solved indicator - we don't have this data, so leaving it out for now */}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {question.category && (
              <Badge className={`text-xs ${difficultyColor}`}>
                {question.category}
              </Badge>
            )}
            {question.company && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100 text-xs border-0">
                {question.company}
              </Badge>
            )}
            {question.interview_stage && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100 text-xs border-0">
                {question.interview_stage}
              </Badge>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
          onClick={onView}
        >
          <Eye className="w-4 h-4 mr-2" />
          View Question
        </Button>
      </div>
    </div>
  );
});

QuestionsListItem.displayName = 'QuestionsListItem';

export const QuestionsList = memo(({ questions, loading, totalCount, startIndex = 0, onSelectQuestion }: QuestionsListProps) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bg-white border border-border rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No questions found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <QuestionsListItem
          key={question.id}
          question={question}
          displayNumber={startIndex + index + 1}
          onView={onSelectQuestion ? () => onSelectQuestion(index) : undefined}
        />
      ))}
    </div>
  );
});

QuestionsList.displayName = 'QuestionsList';

