import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuestions } from "@/hooks/useQuestions";
import { NavigationHeader } from "@/components/NavigationHeader";
import { QuestionsSidebarFilters } from "@/components/QuestionsSidebarFilters";
import { QuestionsList } from "@/components/QuestionsList";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { Search, Shuffle } from "lucide-react";

const ITEMS_PER_PAGE = 10;

const Questions = () => {
  const { isAdmin, user } = useAuth();
  const { questions, loading, error } = useQuestions(isAdmin, !!user);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [filters, setFilters] = useState({
    company: [] as string[],
    category: [] as string[],
    role: [] as string[],
    stage: [] as string[],
  });
  const [randomQuestionDialogOpen, setRandomQuestionDialogOpen] = useState(false);
  const [randomQuestion, setRandomQuestion] = useState<any>(null);

  // Scroll to top when navigating to this page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Initialize from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || "";
    const page = parseInt(params.get('page') || '1', 10);
    const company = params.get('company')?.split(',') || [];
    const category = params.get('category')?.split(',') || [];
    const role = params.get('role')?.split(',') || [];
    const stage = params.get('stage')?.split(',') || [];
    const sort = params.get('sort') || "popularity";

    if (q) setSearchTerm(q);
    if (!Number.isNaN(page) && page > 0) setCurrentPage(page);
    setFilters({ company, category, role, stage });
    setSortBy(sort);
  }, []);

  // Persist to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (currentPage > 1) params.set('page', String(currentPage));
    if (filters.company.length > 0) params.set('company', filters.company.join(','));
    if (filters.category.length > 0) params.set('category', filters.category.join(','));
    if (filters.role.length > 0) params.set('role', filters.role.join(','));
    if (filters.stage.length > 0) params.set('stage', filters.stage.join(','));
    if (sortBy !== "popularity") params.set('sort', sortBy);
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [searchTerm, currentPage, filters, sortBy]);

  // Filter and sort questions
  const filteredAndSortedQuestions = useMemo(() => {
    let filtered = questions || [];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((q) =>
        q.question.toLowerCase().includes(searchLower) ||
        q.company.toLowerCase().includes(searchLower) ||
        q.role.toLowerCase().includes(searchLower) ||
        q.category?.toLowerCase().includes(searchLower) ||
        q.interview_stage?.toLowerCase().includes(searchLower)
      );
    }


    // Company filter
    if (filters.company.length > 0) {
      filtered = filtered.filter(q => filters.company.includes(q.company));
    }

    // Category filter
    if (filters.category.length > 0) {
      filtered = filtered.filter(q => q.category && filters.category.includes(q.category));
    }

    // Role filter
    if (filters.role.length > 0) {
      filtered = filtered.filter(q => filters.role.includes(q.role));
    }

    // Stage filter
    if (filters.stage.length > 0) {
      filtered = filtered.filter(q => q.interview_stage && filters.stage.includes(q.interview_stage));
    }

    // Sort
    if (sortBy === "popularity") {
      // Sort by created_at descending (most recent first)
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    return filtered;
  }, [questions, searchTerm, filters, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedQuestions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const displayedQuestions = filteredAndSortedQuestions.slice(startIndex, endIndex);

  const handlePickRandom = () => {
    if (filteredAndSortedQuestions.length === 0) {
      // Show a toast or message that there are no questions
      return;
    }
    const randomIndex = Math.floor(Math.random() * filteredAndSortedQuestions.length);
    const selectedQuestion = filteredAndSortedQuestions[randomIndex];
    setRandomQuestion(selectedQuestion);
    setRandomQuestionDialogOpen(true);
  };

  const handleFilterChange = (filterType: string, values: string[]) => {
    setFilters(prev => ({ ...prev, [filterType]: values }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      company: [],
      category: [],
      role: [],
      stage: [],
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get unique values for filters
  const getUniqueCompanies = () => {
    const companies = questions?.map(q => q.company).filter(Boolean) || [];
    const counts: Record<string, number> = {};
    companies.forEach(company => {
      counts[company] = (counts[company] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count);
  };

  const getUniqueCategories = () => {
    const categories = questions?.map(q => q.category).filter(Boolean) || [];
    return [...new Set(categories)].sort();
  };

  const getUniqueRoles = () => {
    const roles = questions?.map(q => q.role).filter(Boolean) || [];
    const counts: Record<string, number> = {};
    roles.forEach(role => {
      counts[role] = (counts[role] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count);
  };

  const getUniqueStages = () => {
    const stages = questions?.map(q => q.interview_stage).filter(Boolean) || [];
    const counts: Record<string, number> = {};
    stages.forEach(stage => {
      counts[stage] = (counts[stage] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([stage, count]) => ({ stage, count }))
      .sort((a, b) => b.count - a.count);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8 flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600">Failed to load questions: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <QuestionsSidebarFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              companies={getUniqueCompanies()}
              categories={getUniqueCategories()}
              roles={getUniqueRoles()}
              stages={getUniqueStages()}
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
                    Browse and solve over {questions?.length || 0} questions to prepare for your next interview.
                  </p>
                </div>
                <Button
                  onClick={handlePickRandom}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Pick Random
                </Button>
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
                <SelectTrigger className="w-48 border-gray-200 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Popularity</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Questions List */}
            <QuestionsList
              questions={displayedQuestions}
              loading={loading}
              totalCount={filteredAndSortedQuestions.length}
              startIndex={startIndex}
            />

            {/* Pagination */}
            {!loading && filteredAndSortedQuestions.length > ITEMS_PER_PAGE && (
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
          </main>
        </div>
      </div>

      {/* Random Question Dialog */}
      <Dialog open={randomQuestionDialogOpen} onOpenChange={setRandomQuestionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Random Question</DialogTitle>
          </DialogHeader>
          {randomQuestion && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-foreground mb-2">Question</h3>
                <p className="text-sm text-muted-foreground break-words">{randomQuestion.question}</p>
              </div>
              {randomQuestion.additional_context && (
                <div>
                  <h3 className="font-medium text-foreground mb-2">Additional Context</h3>
                  <div className="p-3 bg-muted rounded-md border border-border overflow-hidden">
                    <RichTextDisplay 
                      content={randomQuestion.additional_context} 
                      className="text-sm break-words"
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <span className="font-medium text-foreground">Company:</span>
                  <p className="text-sm text-muted-foreground break-words">{randomQuestion.company}</p>
                </div>
                <div>
                  <span className="font-medium text-foreground">Role:</span>
                  <p className="text-sm text-muted-foreground break-words">{randomQuestion.role}</p>
                </div>
                <div>
                  <span className="font-medium text-foreground">Category:</span>
                  <p className="text-sm text-muted-foreground break-words">{randomQuestion.category || "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium text-foreground">Stage:</span>
                  <p className="text-sm text-muted-foreground break-words">{randomQuestion.interview_stage || "N/A"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-white border-t border-border/30 mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 Source Edge Database. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Questions;

