
// ABOUTME: User dashboard page component for regular users  
// ABOUTME: Shows current course progress, saved questions, and quick prep options

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  BookOpen, 
  Play, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Bookmark,
  MessageSquare
} from 'lucide-react';
import { slugify } from '@/utils/slugify';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { NavigationHeader } from '@/components/NavigationHeader';
import { QuestionDetailDialog } from '@/components/QuestionDetailDialog';
import type { InterviewQuestion } from '@/services/questionsService';

const QUESTIONS_PER_PAGE = 4;

const UserDashboard = () => {
  const { user, profile, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Handle admin redirect
  useEffect(() => {
    if (!loading && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [loading, isAdmin, navigate]);

  // Fetch user's assigned courses with progress calculation
  const { data: assignedCourses, isLoading: coursesLoading } = useQuery({
    queryKey: ['user-assigned-courses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Single query to get assignments with course details
      const { data: assignments, error: assignmentError } = await supabase
        .from('course_assignments')
        .select(`
          id,
          course_id,
          courses(
            id,
            title,
            description
          )
        `)
        .eq('user_id', user.id);
        
      if (assignmentError) throw assignmentError;
      if (!assignments || assignments.length === 0) return [];

      // Get all course IDs
      const courseIds = assignments.map(a => a.course_id);

      // Batch fetch: all stages for all assigned courses (1 query instead of N)
      const { data: allStages, error: stagesError } = await supabase
        .from('course_stages')
        .select('id, course_id')
        .in('course_id', courseIds);
        
      if (stagesError) throw stagesError;

      // Batch fetch: all user progress for all assigned courses (1 query instead of N)
      const { data: allProgress, error: progressError } = await supabase
        .from('user_progress')
        .select('stage_id, course_id')
        .eq('user_id', user.id)
        .in('course_id', courseIds);
        
      if (progressError) throw progressError;

      // Group stages and progress by course_id in memory
      const stagesByCourse = (allStages || []).reduce((acc, stage) => {
        acc[stage.course_id] = (acc[stage.course_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const progressByCourse = (allProgress || []).reduce((acc, p) => {
        acc[p.course_id] = (acc[p.course_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Build final result
      const coursesWithProgress = assignments.map(assignment => {
        const totalStages = stagesByCourse[assignment.course_id] || 0;
        const completed = progressByCourse[assignment.course_id] || 0;
        const progressPercentage = totalStages > 0 ? Math.round((completed / totalStages) * 100) : 0;
        
        return {
          ...assignment,
          totalStages,
          completedStages: completed,
          progressPercentage
        };
      });
      
      return coursesWithProgress;
    },
    enabled: !!user && !isAdmin,
  });

  // Fetch saved questions (liked questions) with full question details
  const { data: savedQuestions, isLoading: savedQuestionsLoading } = useQuery({
    queryKey: ['saved-questions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('question_likes')
        .select(`
          id,
          question_id,
          interview_questions(
            id,
            question,
            category,
            company,
            role,
            interview_stage,
            additional_context,
            created_at,
            question_type,
            source_url,
            source_website,
            team,
            position_name,
            recommended
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !isAdmin,
  });

  // Fetch completed courses count
  const { data: completedCoursesCount } = useQuery({
    queryKey: ['completed-courses-count', user?.id],
    queryFn: async () => {
      if (!user || !assignedCourses) return 0;
      return assignedCourses.filter(c => c.progressPercentage === 100).length;
    },
    enabled: !!user && !isAdmin && !!assignedCourses,
  });

  // Get the primary course (first assigned course with most progress, or first one)
  const primaryCourse = useMemo(() => {
    if (!assignedCourses || assignedCourses.length === 0) return null;
    // Sort by progress descending to get the one with most progress
    const sorted = [...assignedCourses].sort((a, b) => b.progressPercentage - a.progressPercentage);
    // Prefer in-progress course (>0 but <100%) or return first
    const inProgress = sorted.find(c => c.progressPercentage > 0 && c.progressPercentage < 100);
    return inProgress || sorted[0];
  }, [assignedCourses]);

  // Get unique categories and companies for filter options
  const { uniqueCategories, uniqueCompanies } = useMemo(() => {
    if (!savedQuestions) return { uniqueCategories: [], uniqueCompanies: [] };
    const categories = new Set<string>();
    const companies = new Set<string>();
    savedQuestions.forEach(sq => {
      if (sq.interview_questions?.category) categories.add(sq.interview_questions.category);
      if (sq.interview_questions?.company) companies.add(sq.interview_questions.company);
    });
    return {
      uniqueCategories: Array.from(categories).sort(),
      uniqueCompanies: Array.from(companies).sort()
    };
  }, [savedQuestions]);

  // Filter saved questions by search and filters
  const filteredQuestions = useMemo(() => {
    if (!savedQuestions) return [];
    
    return savedQuestions.filter(sq => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          sq.interview_questions?.question?.toLowerCase().includes(query) ||
          sq.interview_questions?.category?.toLowerCase().includes(query) ||
          sq.interview_questions?.company?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // Category filter
      if (selectedCategories.length > 0) {
        if (!sq.interview_questions?.category || !selectedCategories.includes(sq.interview_questions.category)) {
          return false;
        }
      }
      
      // Company filter
      if (selectedCompanies.length > 0) {
        if (!sq.interview_questions?.company || !selectedCompanies.includes(sq.interview_questions.company)) {
          return false;
        }
      }
      
      return true;
    });
  }, [savedQuestions, searchQuery, selectedCategories, selectedCompanies]);

  // Check if any filters are active
  const hasActiveFilters = selectedCategories.length > 0 || selectedCompanies.length > 0;

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedCompanies([]);
    setCurrentPage(1);
  }, []);

  // Toggle category filter
  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
    setCurrentPage(1);
  }, []);

  // Toggle company filter
  const toggleCompany = useCallback((company: string) => {
    setSelectedCompanies(prev => 
      prev.includes(company) 
        ? prev.filter(c => c !== company)
        : [...prev, company]
    );
    setCurrentPage(1);
  }, []);

  // Paginate questions
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * QUESTIONS_PER_PAGE;
    return filteredQuestions.slice(start, start + QUESTIONS_PER_PAGE);
  }, [filteredQuestions, currentPage]);

  const totalPages = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE);

  // Get selected question for dialog
  const selectedQuestion = useMemo(() => {
    if (selectedQuestionIndex === null || !filteredQuestions[selectedQuestionIndex]) return null;
    const sq = filteredQuestions[selectedQuestionIndex];
    if (!sq.interview_questions) return null;
    return sq.interview_questions as unknown as InterviewQuestion;
  }, [filteredQuestions, selectedQuestionIndex]);

  // Open question dialog
  const handleOpenQuestion = useCallback((index: number) => {
    // Calculate the actual index in filteredQuestions based on current page
    const actualIndex = (currentPage - 1) * QUESTIONS_PER_PAGE + index;
    setSelectedQuestionIndex(actualIndex);
    setIsQuestionDialogOpen(true);
  }, [currentPage]);

  // Navigate to previous/next question in dialog
  const handlePrevQuestion = useCallback(() => {
    if (selectedQuestionIndex !== null && selectedQuestionIndex > 0) {
      setSelectedQuestionIndex(selectedQuestionIndex - 1);
    }
  }, [selectedQuestionIndex]);

  const handleNextQuestion = useCallback(() => {
    if (selectedQuestionIndex !== null && selectedQuestionIndex < filteredQuestions.length - 1) {
      setSelectedQuestionIndex(selectedQuestionIndex + 1);
    }
  }, [selectedQuestionIndex, filteredQuestions.length]);

  // Determine course card button state and text - memoized to prevent recalculation
  const courseButton = useMemo(() => {
    if (!assignedCourses || assignedCourses.length === 0) {
      return { text: 'View Courses', icon: BookOpen, action: () => navigate('/tracks') };
    }
    if (primaryCourse && primaryCourse.progressPercentage > 0) {
      return { 
        text: 'Continue Learning', 
        icon: Play, 
        action: () => navigate(`/course/${slugify(primaryCourse.courses?.title || '')}`) 
      };
    }
    return { 
      text: 'Start Course', 
      icon: Play, 
      action: () => navigate(`/course/${slugify(primaryCourse?.courses?.title || '')}`) 
    };
  }, [assignedCourses, primaryCourse, navigate]);

  // Show loading state while authentication is being resolved
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-73px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-foreground font-semibold">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if user is admin (will redirect)
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-73px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-foreground font-semibold">Redirecting to admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const userName = profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || 'Candidate';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[{ label: 'Home', href: '/' }, { label: 'Candidate Dashboard' }]} 
          className="mb-4" 
        />
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">
            Welcome back, {userName}
          </h1>
          <p className="text-muted-foreground">
            Continue your preparation and manage your saved practice topics.
          </p>
        </div>

        {/* Current Course Card */}
        {coursesLoading ? (
          <Card className="mb-8">
            <CardContent className="p-6">
              <LoadingSkeleton lines={3} />
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8 overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                {/* Course Image */}
                <div className="md:w-48 h-40 md:h-auto bg-gradient-to-br from-slate-800 to-slate-900 flex-shrink-0">
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <div className="text-xs font-mono text-green-400 opacity-80 leading-relaxed">
                      {`def learn():\n  practice()\n  succeed()`}
                    </div>
                  </div>
                </div>
                
                {/* Course Info */}
                <div className="flex-1 p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      {primaryCourse ? (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            {primaryCourse.progressPercentage > 0 ? (
                              <span className="text-xs font-semibold text-primary uppercase tracking-wide flex items-center gap-1">
                                IN PROGRESS <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                NOT STARTED
                              </span>
                            )}
                          </div>
                          <h2 className="text-xl font-semibold text-foreground mb-3">
                            {primaryCourse.courses?.title || 'Course'}
                          </h2>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Course Progress</span>
                              <span className="text-primary font-medium">
                                {primaryCourse.progressPercentage}% ({primaryCourse.completedStages}/{primaryCourse.totalStages} lessons)
                              </span>
                            </div>
                            <Progress value={primaryCourse.progressPercentage} className="h-2" />
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                            NO COURSE ASSIGNED
                          </span>
                          <h2 className="text-xl font-semibold text-foreground mb-2">
                            Get Started with Your Interview Prep
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Browse available courses to begin your journey.
                          </p>
                        </>
                      )}
                    </div>
                    
                    <Button 
                      size="lg" 
                      className="bg-primary hover:bg-primary/90 text-white px-6"
                      onClick={courseButton.action}
                    >
                      <courseButton.icon className="w-4 h-4 mr-2" />
                      {courseButton.text}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Saved Questions Section */}
          <div className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-semibold text-foreground">Saved Questions</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search saved items..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9 w-48 sm:w-56"
                  />
                </div>
                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={hasActiveFilters ? 'border-primary' : ''}>
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                          {selectedCategories.length + selectedCompanies.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-4" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Filters</h4>
                        {hasActiveFilters && (
                          <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground" onClick={clearFilters}>
                            Clear all
                          </Button>
                        )}
                      </div>
                      
                      {/* Category Filter */}
                      {uniqueCategories.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground uppercase">Category</Label>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {uniqueCategories.map(category => (
                              <div key={category} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`category-${category}`}
                                  checked={selectedCategories.includes(category)}
                                  onCheckedChange={() => toggleCategory(category)}
                                />
                                <label
                                  htmlFor={`category-${category}`}
                                  className="text-sm cursor-pointer flex-1 truncate"
                                >
                                  {category}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Company Filter */}
                      {uniqueCompanies.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground uppercase">Company</Label>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {uniqueCompanies.map(company => (
                              <div key={company} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`company-${company}`}
                                  checked={selectedCompanies.includes(company)}
                                  onCheckedChange={() => toggleCompany(company)}
                                />
                                <label
                                  htmlFor={`company-${company}`}
                                  className="text-sm cursor-pointer flex-1 truncate"
                                >
                                  {company}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {uniqueCategories.length === 0 && uniqueCompanies.length === 0 && (
                        <p className="text-sm text-muted-foreground">No filter options available.</p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                {savedQuestionsLoading ? (
                  <div className="p-6">
                    <LoadingSkeleton lines={4} />
                  </div>
                ) : filteredQuestions.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bookmark className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      {searchQuery || hasActiveFilters 
                        ? 'No questions match your filters.' 
                        : 'No saved questions yet. Like questions to save them here.'}
                    </p>
                    {hasActiveFilters && (
                      <Button variant="link" size="sm" onClick={clearFilters} className="mt-2">
                        Clear filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b">
                      <div className="col-span-5">Question</div>
                      <div className="col-span-3">Category</div>
                      <div className="col-span-2">Company</div>
                      <div className="col-span-2">Action</div>
                    </div>
                    
                    {/* Table Rows */}
                    {paginatedQuestions.map((sq, index) => {
                      return (
                        <div 
                          key={sq.id} 
                          className="grid grid-cols-12 gap-4 px-4 py-4 items-center border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                        >
                          <div className="col-span-5 flex items-center gap-3">
                            <Bookmark className="w-4 h-4 text-primary flex-shrink-0 fill-primary" />
                            <span className="text-sm font-medium text-foreground truncate">
                              {sq.interview_questions?.question || 'Unknown Question'}
                            </span>
                          </div>
                          <div className="col-span-3">
                            <span className="text-sm text-muted-foreground">
                              {sq.interview_questions?.category || 'General'}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-sm text-muted-foreground">
                              {sq.interview_questions?.company || '—'}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="text-primary p-0 h-auto"
                              onClick={() => handleOpenQuestion(index)}
                            >
                              Practice Now
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Table Footer */}
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
                      <span className="text-sm text-muted-foreground">
                        {filteredQuestions.length} saved questions total
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage >= totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Prep Sidebar */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">Quick Prep</h2>
            
            {/* Non-Technical Coaching Card */}
            <Card className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                    Non-Technical Coaching
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Master your behavioral interviews
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Work with experts to refine your storytelling, cultural fit responses, and soft skills to stand out in leadership and behavioral rounds.
                </p>
                <Button className="w-full" variant="secondary" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            {/* Your Library Stats */}
            <Card>
              <CardContent className="p-5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  Your Library
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Saved</span>
                    <span className="font-semibold text-foreground">{savedQuestions?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Courses Completed</span>
                    <span className="font-semibold text-foreground">{completedCoursesCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Next Session</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                      None Scheduled
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-border/30 mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 Source Edge Database. All rights reserved.
        </div>
      </footer>

      {/* Question Detail Dialog */}
      <QuestionDetailDialog
        open={isQuestionDialogOpen}
        onOpenChange={setIsQuestionDialogOpen}
        question={selectedQuestion}
        currentDisplayNumber={selectedQuestionIndex !== null ? selectedQuestionIndex + 1 : 0}
        totalCount={filteredQuestions.length}
        onPrev={handlePrevQuestion}
        onNext={handleNextQuestion}
        canPrev={selectedQuestionIndex !== null && selectedQuestionIndex > 0}
        canNext={selectedQuestionIndex !== null && selectedQuestionIndex < filteredQuestions.length - 1}
      />
    </div>
  );
};

export default UserDashboard;
