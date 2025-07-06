
import { memo, useMemo } from "react";
import { QuestionCard } from "./QuestionCard";
import { SkeletonCard } from "./SkeletonCard";
import type { InterviewQuestion } from "@/services/questionsService";

interface OptimizedQuestionListProps {
  questions: InterviewQuestion[];
  loading: boolean;
  isAdmin: boolean;
  onEdit?: (question: InterviewQuestion) => void;
  onDelete?: (questionId: string) => void;
  currentPage?: number;
  itemsPerPage?: number;
}

const SKELETON_COUNT = 6;

export const OptimizedQuestionList = memo(({ 
  questions, 
  loading, 
  isAdmin, 
  onEdit, 
  onDelete,
  currentPage = 1,
  itemsPerPage = 10
}: OptimizedQuestionListProps) => {
  const paginatedQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return questions.slice(startIndex, endIndex);
  }, [questions, currentPage, itemsPerPage]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (paginatedQuestions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No questions found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {paginatedQuestions.map((question) => (
        <QuestionCard
          key={question.id}
          question={question}
          onEdit={isAdmin ? onEdit : undefined}
          onDelete={isAdmin ? onDelete : undefined}
        />
      ))}
    </div>
  );
});

OptimizedQuestionList.displayName = "OptimizedQuestionList";
