
import { memo, useMemo, useEffect } from "react";
import QuestionCard from "./QuestionCard";
import { SkeletonCard } from "./SkeletonCard";
import { LoadingSpinner } from "./ui/loading-spinner";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import ErrorBoundary from "./ui/error-boundary";
import type { InterviewQuestion } from "@/services/questionsService";

interface OptimizedQuestionListProps {
  questions: InterviewQuestion[];
  loading: boolean;
  isAdmin: boolean;
  onEdit?: (question: InterviewQuestion) => void;
  onDelete?: (questionId: string) => void;
  currentPage?: number;
  itemsPerPage?: number;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  useInfiniteScroll?: boolean;
}

const SKELETON_COUNT = 6;

export const OptimizedQuestionList = memo(({ 
  questions, 
  loading, 
  isAdmin, 
  onEdit, 
  onDelete,
  currentPage = 1,
  itemsPerPage = 10,
  hasNextPage = false,
  onLoadMore,
  useInfiniteScroll: enableInfiniteScroll = false
}: OptimizedQuestionListProps) => {
  const { isFetching, setTarget, resetFetching } = useInfiniteScroll({
    hasNextPage,
    isLoading: loading,
  });

  useEffect(() => {
    if (isFetching && onLoadMore) {
      onLoadMore();
      resetFetching();
    }
  }, [isFetching, onLoadMore, resetFetching]);

  const displayQuestions = useMemo(() => {
    if (enableInfiniteScroll) {
      return questions;
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return questions.slice(startIndex, endIndex);
  }, [questions, currentPage, itemsPerPage, enableInfiniteScroll]);

  if (loading && displayQuestions.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-token-lg">
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (displayQuestions.length === 0) {
    return (
      <div className="text-center py-token-4xl animate-fade-in">
        <p className="text-muted-foreground text-token-lg">No questions found.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-token-lg">
        {displayQuestions.map((question, index) => (
          <div 
            key={question.id}
            style={{ animationDelay: `${index * 50}ms` }}
            className="animate-fade-in"
          >
            <QuestionCard question={question} />
          </div>
        ))}
      </div>
      
      {enableInfiniteScroll && hasNextPage && (
        <div ref={setTarget} className="flex justify-center py-token-xl">
          {loading && <LoadingSpinner text="Loading more questions..." />}
        </div>
      )}
      
      {loading && displayQuestions.length > 0 && !enableInfiniteScroll && (
        <div className="flex justify-center py-token-lg">
          <LoadingSpinner text="Loading..." />
        </div>
      )}
    </ErrorBoundary>
  );
});

OptimizedQuestionList.displayName = "OptimizedQuestionList";
