
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { OptimizedQuestionList } from "./OptimizedQuestionList";
import { QuestionFilters } from "./QuestionFilters";
import { Button } from "@/components/ui/button";
import type { InterviewQuestion } from "@/services/questionsService";

interface QuestionsSectionProps {
  questions: InterviewQuestion[];
  loading: boolean;
  error: string | null;
}

const ITEMS_PER_PAGE = 12;

export const QuestionsSection = ({ questions, loading, error }: QuestionsSectionProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    company: "",
    role: "",
    category: "",
    interview_stage: ""
  });

  // Initialize state from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || "";
    const company = params.get('company') || "";
    const role = params.get('role') || "";
    const category = params.get('category') || "";
    const interview_stage = params.get('stage') || "";

    if (q) setSearchTerm(q);
    setFilters({ company, role, category, interview_stage });
  }, []);

  // Persist state to URL params (replace, not push)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (searchTerm) params.set('q', searchTerm); else params.delete('q');
    if (filters.company) params.set('company', filters.company); else params.delete('company');
    if (filters.role) params.set('role', filters.role); else params.delete('role');
    if (filters.category) params.set('category', filters.category); else params.delete('category');
    if (filters.interview_stage) params.set('stage', filters.interview_stage); else params.delete('stage');
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [searchTerm, filters]);

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
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilters({
      company: "",
      role: "",
      category: "",
      interview_stage: ""
    });
  };

  if (error) {
    return (
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-foreground mb-6">Interview Questions</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">Failed to load questions: {error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-6">Interview Questions</h2>
      
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
        currentPage={1}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {!loading && filteredQuestions.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" size="lg" asChild>
            <Link to="/questions">View More Questions</Link>
          </Button>
        </div>
      )}
    </section>
  );
};
