
import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { OptimizedQuestionList } from "./OptimizedQuestionList";
import { QuestionFilters } from "./QuestionFilters";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/components/AuthModal";
import { Lock, LogIn, UserPlus } from "lucide-react";

const QuestionDetailDialog = lazy(() =>
  import("./QuestionDetailDialog").then(m => ({ default: m.QuestionDetailDialog }))
);
import type { InterviewQuestion } from "@/services/questionsService";

interface QuestionsSectionProps {
  questions: InterviewQuestion[];
  loading: boolean;
  error: string | null;
}

const ITEMS_PER_PAGE = 9;

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
        question.interview_stage?.toLowerCase().includes(searchLower);
      
      const matchesCompany = !filters.company || question.company === filters.company;
      const matchesRole = !filters.role || question.role === filters.role;
      const matchesCategory = !filters.category || question.category === filters.category;
      const matchesStage = !filters.interview_stage || question.interview_stage === filters.interview_stage;
      
      return matchesSearch && matchesCompany && matchesRole && matchesCategory && matchesStage;
    });
  }, [questions, searchTerm, filters]);

  const displayedQuestions = useMemo(
    () => filteredQuestions.slice(0, ITEMS_PER_PAGE),
    [filteredQuestions]
  );
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { openSignIn, openSignUp } = useAuthModal();
  const isAuthenticated = !authLoading && !!user;

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
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Interview Questions</h2>
          <p className="text-muted-foreground">Real-life interview questions based on previous candidates' experiences, carefully tailored and curated.</p>
        </div>
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-400">Failed to load questions: {error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Interview Questions</h2>
        <p className="text-muted-foreground">
          Real-life interview questions based on previous candidates&apos; experiences, carefully tailored and curated.
        </p>
      </div>
      
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

      {/* Auth-aware preview: loading skeleton, full list for logged-in, blur + login wall for logged-out */}
      {authLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-neutral-700 rounded w-3/4 mb-3" />
              <div className="h-3 bg-neutral-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : isAuthenticated ? (
        <>
          <OptimizedQuestionList
            questions={displayedQuestions}
            loading={loading}
            isAdmin={false}
            currentPage={1}
            itemsPerPage={ITEMS_PER_PAGE}
            lightweight
            onSelectQuestion={(index) => setSelectedQuestionIndex(index)}
          />

          <Suspense fallback={null}>
            <QuestionDetailDialog
              open={selectedQuestionIndex !== null}
              onOpenChange={(open) => !open && setSelectedQuestionIndex(null)}
              question={selectedQuestionIndex !== null ? displayedQuestions[selectedQuestionIndex] ?? null : null}
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
          </Suspense>

          {!loading && filteredQuestions.length > 0 && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" size="lg" asChild>
                <Link to="/questions">View More Questions</Link>
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="relative">
          {/* Blurred placeholder question rows for logged-out users */}
          <div className="blur-sm select-none pointer-events-none space-y-3" aria-hidden="true">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-neutral-900 rounded-lg border border-neutral-800 p-4"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">{i + 1}.</span>
                    <div className="h-5 bg-neutral-700 rounded w-3/4" />
                  </div>
                  <div className="flex gap-2">
                    <span className="bg-orange-900/40 text-orange-400 text-xs px-2 py-0.5 rounded">
                      Technical
                    </span>
                    <span className="bg-neutral-800 text-neutral-400 text-xs px-2 py-0.5 rounded">
                      Company
                    </span>
                    <span className="bg-cyan-900/40 text-cyan-400 text-xs px-2 py-0.5 rounded">
                      Stage
                    </span>
                  </div>
                </div>
                <div className="h-9 w-28 bg-gray-800 rounded-lg" />
              </div>
            ))}
          </div>

          {/* Login wall overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-neutral-900 rounded-2xl shadow-2xl shadow-black/20 border border-neutral-800 px-8 py-8 max-w-md w-full mx-4 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Sign in to view interview questions
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Create a free account or sign in to browse real questions, see details, and track your prep across companies and roles.
              </p>
              <div className="flex gap-3">
                <Button className="flex-1 btn-cta" onClick={openSignIn}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
                <Button variant="outline" className="flex-1" onClick={openSignUp}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Register
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
