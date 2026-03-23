import { useState, useMemo, useEffect, useCallback, lazy, Suspense } from "react";

import { useAuth } from "@/hooks/useAuth";
import { usePaginatedQuestions } from "@/hooks/usePaginatedQuestions";
import { useQuestionStats } from "@/hooks/useQuestionStats";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Seo } from "@/components/Seo";
import { QuestionsSidebarFilters } from "@/components/QuestionsSidebarFilters";
import { QuestionsList } from "@/components/QuestionsList";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditQuestionForm } from "@/components/EditQuestionForm";

// Lazy-load the heavy dialog — only downloaded when user clicks a question
const QuestionDetailDialog = lazy(() =>
  import("@/components/QuestionDetailDialog").then(m => ({ default: m.QuestionDetailDialog }))
);
import type { InterviewQuestion } from "@/services/questionsService";
import { Search, Shuffle, Lock, LogIn, UserPlus } from "lucide-react";
import { useAuthModal } from "@/components/AuthModal";

const ITEMS_PER_PAGE = 10;

const Questions = () => {
  const { isAdmin, user, loading: authLoading } = useAuth();
  const { openSignIn, openSignUp } = useAuthModal();
  const isAuthenticated = !authLoading && !!user;

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<"popularity" | "newest" | "oldest">("popularity");
  const [filters, setFilters] = useState({
    company: [] as string[],
    category: [] as string[],
    role: [] as string[],
    stage: [] as string[],
  });
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const [editQuestion, setEditQuestion] = useState<InterviewQuestion | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Debounce search input (300ms) so we don't fire a query on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to page 1 on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Server-side paginated + filtered questions
  const { questions: displayedQuestions, totalCount, loading, error, refetch } = usePaginatedQuestions(
    {
      isAdmin,
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      search: debouncedSearch || undefined,
      company: filters.company.length > 0 ? filters.company : undefined,
      category: filters.category.length > 0 ? filters.category : undefined,
      role: filters.role.length > 0 ? filters.role : undefined,
      stage: filters.stage.length > 0 ? filters.stage : undefined,
      sortBy,
    },
    !authLoading,
  );

  // Fetch lightweight stats (counts only) — used for both authenticated (filter sidebar) and anonymous users
  const { stats, loading: statsLoading } = useQuestionStats(!authLoading);

  // Scroll to top when navigating to this page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Initialize from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || "";
    const page = parseInt(params.get('page') || '1', 10);
    const company = params.get('company')?.split(',').filter(Boolean) || [];
    const category = params.get('category')?.split(',').filter(Boolean) || [];
    const role = params.get('role')?.split(',').filter(Boolean) || [];
    const stage = params.get('stage')?.split(',').filter(Boolean) || [];
    const sort = params.get('sort') || "popularity";

    if (q) { setSearchTerm(q); setDebouncedSearch(q); }
    if (!Number.isNaN(page) && page > 0) setCurrentPage(page);
    setFilters({ company, category, role, stage });
    setSortBy(sort as "popularity" | "newest" | "oldest");
  }, []);

  // Persist to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (currentPage > 1) params.set('page', String(currentPage));
    if (filters.company.length > 0) params.set('company', filters.company.join(','));
    if (filters.category.length > 0) params.set('category', filters.category.join(','));
    if (filters.role.length > 0) params.set('role', filters.role.join(','));
    if (filters.stage.length > 0) params.set('stage', filters.stage.join(','));
    if (sortBy !== "popularity") params.set('sort', sortBy);
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [debouncedSearch, currentPage, filters, sortBy]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const handleOpenEditFromDialog = useCallback((question: InterviewQuestion) => {
    setEditQuestion(question);
    setEditDialogOpen(true);
  }, []);

  const handlePickRandom = useCallback(() => {
    if (totalCount === 0) return;
    const randomPage = Math.floor(Math.random() * totalPages) + 1;
    setCurrentPage(randomPage);
    // We'll select index 0 on the new page for simplicity
    setSelectedQuestionIndex(0);
  }, [totalCount, totalPages]);

  const handleFilterChange = useCallback((filterType: string, values: string[]) => {
    setFilters(prev => ({ ...prev, [filterType]: values }));
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      company: [],
      category: [],
      role: [],
      stage: [],
    });
    setSearchTerm("");
    setDebouncedSearch("");
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Total question count — use server totalCount for authenticated, stats for anonymous
  const totalQuestionCount = useMemo(() => {
    if (isAuthenticated) return totalCount;
    return stats?.total_count || 0;
  }, [isAuthenticated, totalCount, stats]);

  // Use stats for filter sidebar values (lightweight, works for both auth states)
  const uniqueCompanies = useMemo(() => {
    return stats?.companies || [];
  }, [stats]);

  const uniqueCategories = useMemo(() => {
    return stats?.categories || [];
  }, [stats]);

  const uniqueRoles = useMemo(() => {
    return stats?.roles || [];
  }, [stats]);

  const uniqueStages = useMemo(() => {
    return stats?.stages || [];
  }, [stats]);

  if (error && isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8 flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400">Failed to load questions: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <Seo
        title="Interview Questions"
        description="Browse interview questions by company, role, category, and stage to prepare for your next technical interview."
        path="/questions"
      />
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <QuestionsSidebarFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              companies={uniqueCompanies}
              categories={uniqueCategories}
              roles={uniqueRoles}
              stages={uniqueStages}
            />
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">Practice Questions</h1>
                  <p className="text-muted-foreground">
                    Browse and solve over {totalQuestionCount} questions to prepare for your next interview.
                  </p>
                </div>
                {isAuthenticated && (
                  <Button
                    onClick={handlePickRandom}
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    Pick Random
                  </Button>
                )}
              </div>
            </div>

            {/* Search and Sort Bar */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions by title, tag or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 border-neutral-700 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Popularity</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Questions List - loading / login wall / actual content */}
            {authLoading ? (
              /* Show loading skeleton while auth is resolving — prevents login wall flash */
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-neutral-900 border border-border rounded-lg p-6 animate-pulse">
                    <div className="h-4 bg-neutral-700 rounded w-3/4 mb-3"></div>
                    <div className="h-3 bg-neutral-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : isAuthenticated ? (
              <>
                <QuestionsList
                  questions={displayedQuestions}
                  loading={loading}
                  totalCount={totalCount}
                  startIndex={startIndex}
                  onSelectQuestion={(index) => setSelectedQuestionIndex(index)}
                />

                {/* Question detail dialog (View Question) — lazy-loaded */}
                <Suspense fallback={null}>
                <QuestionDetailDialog
                  open={selectedQuestionIndex !== null}
                  onOpenChange={(open) => !open && setSelectedQuestionIndex(null)}
                  question={selectedQuestionIndex !== null ? displayedQuestions[selectedQuestionIndex] ?? null : null}
                  currentDisplayNumber={selectedQuestionIndex !== null ? startIndex + selectedQuestionIndex + 1 : 1}
                  totalCount={totalCount}
                  onPrev={() => {
                    if (selectedQuestionIndex === null) return;
                    if (selectedQuestionIndex > 0) {
                      setSelectedQuestionIndex(selectedQuestionIndex - 1);
                    } else if (currentPage > 1) {
                      setCurrentPage(currentPage - 1);
                      setSelectedQuestionIndex(ITEMS_PER_PAGE - 1);
                    }
                  }}
                  onNext={() => {
                    if (selectedQuestionIndex === null) return;
                    if (selectedQuestionIndex < displayedQuestions.length - 1) {
                      setSelectedQuestionIndex(selectedQuestionIndex + 1);
                    } else if (currentPage < totalPages) {
                      setCurrentPage(currentPage + 1);
                      setSelectedQuestionIndex(0);
                    }
                  }}
                  canPrev={
                    selectedQuestionIndex !== null &&
                    (selectedQuestionIndex > 0 || currentPage > 1)
                  }
                  canNext={
                    selectedQuestionIndex !== null &&
                    (selectedQuestionIndex < displayedQuestions.length - 1 ||
                      currentPage < totalPages)
                  }
                  showEditButton={isAdmin}
                  onEditQuestion={handleOpenEditFromDialog}
                />
                </Suspense>

                {/* Pagination */}
                {!loading && totalCount > ITEMS_PER_PAGE && (
                  <div className="mt-8 flex justify-center">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        ←
                      </Button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNumber = i + 1;
                        if (totalPages > 5 && pageNumber === 5 && currentPage < totalPages - 1) {
                          return (
                            <span key={pageNumber} className="px-3 py-1 text-muted-foreground">
                              ...
                            </span>
                          );
                        }
                        return (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNumber)}
                            className={currentPage === pageNumber ? "bg-primary text-primary-foreground" : ""}
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                      
                      {totalPages > 5 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(totalPages)}
                          className={currentPage === totalPages ? "bg-primary text-primary-foreground" : ""}
                        >
                          {totalPages}
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        →
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="relative">
                {/* Blurred placeholder question rows */}
                <div className="blur-sm select-none pointer-events-none space-y-3" aria-hidden="true">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between bg-neutral-900 rounded-lg border border-neutral-800 p-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">{i + 1}.</span>
                          <div className="h-5 bg-neutral-700 rounded w-3/4"></div>
                        </div>
                        <div className="flex gap-2">
                          <span className="bg-orange-900/40 text-orange-400 text-xs px-2 py-0.5 rounded">Technical</span>
                          <span className="bg-neutral-800 text-neutral-400 text-xs px-2 py-0.5 rounded">Company</span>
                          <span className="bg-cyan-900/40 text-cyan-400 text-xs px-2 py-0.5 rounded">Stage</span>
                        </div>
                      </div>
                      <div className="h-9 w-28 bg-gray-800 rounded-lg"></div>
                    </div>
                  ))}
                </div>

                {/* Login wall overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-neutral-900 rounded-2xl shadow-2xl shadow-black/20 border border-neutral-800 px-8 py-8 max-w-md w-full mx-4 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Unlock All {totalQuestionCount > 0 ? totalQuestionCount : ''} Questions</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Sign in to browse and practice interview questions, view detailed answers, and track your progress.
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
                    <p className="text-xs text-muted-foreground mt-4">
                      Trusted by candidates at top tech companies.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Edit Question Dialog (admin only) */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
          </DialogHeader>
          {editQuestion && (
            <EditQuestionForm
              question={editQuestion}
              onSuccess={() => {
                setEditDialogOpen(false);
                refetch();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-neutral-900 border-t border-border/30 mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 Omiyages. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Questions;

