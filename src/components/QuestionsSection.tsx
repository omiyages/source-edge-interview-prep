
import { useState, useMemo } from "react";
import { OptimizedQuestionList } from "./OptimizedQuestionList";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import type { InterviewQuestion } from "@/services/questionsService";

interface QuestionsSectionProps {
  questions: InterviewQuestion[];
  loading: boolean;
  error: string | null;
}

const ITEMS_PER_PAGE = 12;

export const QuestionsSection = ({ questions, loading, error }: QuestionsSectionProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => {
    return Math.ceil(questions.length / ITEMS_PER_PAGE);
  }, [questions.length]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error) {
    return (
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Interview Questions</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">Failed to load questions: {error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Interview Questions</h2>
      
      <OptimizedQuestionList
        questions={questions}
        loading={loading}
        isAdmin={false}
        currentPage={currentPage}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {!loading && questions.length > ITEMS_PER_PAGE && (
        <div className="mt-8 flex justify-center">
          <Pagination>
            <PaginationContent>
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="cursor-pointer"
                  />
                </PaginationItem>
              )}
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = i + 1;
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => handlePageChange(pageNumber)}
                      isActive={currentPage === pageNumber}
                      className="cursor-pointer"
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="cursor-pointer"
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </section>
  );
};
