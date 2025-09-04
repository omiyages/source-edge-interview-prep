
import { useState, useMemo } from "react";
import { OptimizedQuestionList } from "./OptimizedQuestionList";
import { QuestionFilters } from "./QuestionFilters";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    company: "",
    role: "",
    category: "",
    interview_stage: ""
  });

  // Filter questions based on search term and filters
  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        question.question.toLowerCase().includes(searchLower) ||
        question.company.toLowerCase().includes(searchLower) ||
        question.role.toLowerCase().includes(searchLower) ||
        question.category?.toLowerCase().includes(searchLower) ||
        question.interview_stage?.toLowerCase().includes(searchLower) ||
        question.additional_context?.toLowerCase().includes(searchLower) ||
        question.team?.toLowerCase().includes(searchLower) ||
        question.position_name?.toLowerCase().includes(searchLower) ||
        question.source_website?.toLowerCase().includes(searchLower);
      
      const matchesCompany = !filters.company || question.company === filters.company;
      const matchesRole = !filters.role || question.role === filters.role;
      const matchesCategory = !filters.category || question.category === filters.category;
      const matchesStage = !filters.interview_stage || question.interview_stage === filters.interview_stage;
      
      return matchesSearch && matchesCompany && matchesRole && matchesCategory && matchesStage;
    });
  }, [questions, searchTerm, filters]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE);
  }, [filteredQuestions.length]);

  // Get unique values for filter dropdowns
  const getUniqueValues = (field: string) => {
    const values = questions.map((q: any) => q[field]).filter(Boolean);
    let uniqueValues = [...new Set(values)].sort();
    
    // Update role options according to user requirements
    if (field === 'role') {
      uniqueValues = uniqueValues.map(role => {
        if (role === 'Product Manager') return 'Product/Project Manager';
        if (role === 'Frontend Engineer') return 'Frontend/Fullstack Engineer';
        return role;
      });
      
      // Remove fullstack engineer if it exists
      uniqueValues = uniqueValues.filter(role => role !== 'fullstack engineer' && role !== 'Fullstack Engineer');
      
      // Add ML/AI Engineer if not present
      if (!uniqueValues.includes('ML/AI Engineer')) {
        uniqueValues.push('ML/AI Engineer');
        uniqueValues.sort();
      }
    }
    
    return uniqueValues;
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilters({
      company: "",
      role: "",
      category: "",
      interview_stage: ""
    });
    setCurrentPage(1);
  };

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
      
      <div className="mb-6">
        <QuestionFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          getUniqueValues={getUniqueValues}
          resultCount={filteredQuestions.length}
        />
      </div>
      
      <OptimizedQuestionList
        questions={filteredQuestions}
        loading={loading}
        isAdmin={false}
        currentPage={currentPage}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {!loading && filteredQuestions.length > ITEMS_PER_PAGE && (
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
