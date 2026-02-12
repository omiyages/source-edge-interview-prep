
import React, { useState, useCallback, Suspense } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuestions } from "@/hooks/useQuestions";
import { useQuestionStats } from "@/hooks/useQuestionStats";
import { useResources } from "@/hooks/useResources";
import { HeroSection } from "@/components/HeroSection";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Lock, LogIn, UserPlus } from "lucide-react";

// Lazy load non-critical components
const ResourcesPreview = React.lazy(() => import("@/components/ResourcesPreview").then(module => ({ default: module.ResourcesPreview })));
const FeaturedCoursesPreview = React.lazy(() => import("@/components/FeaturedCoursesPreview").then(module => ({ default: module.FeaturedCoursesPreview })));
const QuestionsSection = React.lazy(() => import("@/components/QuestionsSection").then(module => ({ default: module.QuestionsSection })));

const Index = () => {
  const { user, isAdmin, loading: authLoading, profile } = useAuth();
  const { toast } = useToast();
  const isAuthenticated = !authLoading && !!user;
  
  // Only fetch full questions for authenticated users
  const { questions, loading: questionsLoading, error: questionsError, refetch: refetchQuestions } = useQuestions(isAdmin, isAuthenticated);
  // Fetch lightweight stats (counts only) for anonymous users
  const { stats } = useQuestionStats(!isAuthenticated && !authLoading);
  const { resources, loading: resourcesLoading } = useResources(!authLoading);
  
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSubmitSuccess = useCallback(() => {
    setDialogOpen(false);
    toast({
      title: "Question submitted!",
      description: "Your question has been submitted for review.",
    });
    refetchQuestions();
  }, [toast, refetchQuestions]);

  // Show loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeroSection 
        isAdmin={isAdmin}
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        onSubmitSuccess={handleSubmitSuccess}
      />

      <div className="container mx-auto px-4 py-8 flex-1 space-y-16">
        {/* 1. Interview Questions — gated for unauthenticated users */}
        {isAuthenticated ? (
          <Suspense fallback={
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-48 mb-4"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          }>
            <QuestionsSection 
              questions={questions}
              loading={questionsLoading}
              error={questionsError}
            />
          </Suspense>
        ) : (
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-2">Interview Questions</h2>
            <p className="text-muted-foreground mb-6">Practice with real interview questions from top companies.</p>
            <div className="relative">
              {/* Blurred placeholder cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 blur-sm select-none pointer-events-none" aria-hidden="true">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
                    <div className="flex gap-2">
                      <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded">Technical</span>
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">Company</span>
                    </div>
                    <div className="h-5 bg-gray-200 rounded w-full"></div>
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="flex gap-2 mt-2">
                      <span className="bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded">Stage</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Login wall overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 px-8 py-8 max-w-md w-full mx-4 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Unlock All {stats?.total_count ? stats.total_count : ''} Questions</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Sign in to access all interview questions, detailed answers, and track your progress.
                  </p>
                  <div className="flex gap-3">
                    <Button asChild className="flex-1 btn-purple-gradient">
                      <Link to="/auth">
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                      <Link to="/signup">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Register
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 2. Courses */}
        <Suspense fallback={
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden">
                  <div className="h-40 bg-muted"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-5 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-32"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        }>
          <FeaturedCoursesPreview enabled={!authLoading} />
        </Suspense>

        {/* 3. Resources */}
        <Suspense fallback={
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        }>
          <ResourcesPreview 
            resources={resources}
            loading={resourcesLoading}
          />
        </Suspense>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-border/30 mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 Source Edge Database. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
