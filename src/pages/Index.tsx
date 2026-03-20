
import React, { useState, useCallback, Suspense } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuestions } from "@/hooks/useQuestions";
import { useQuestionStats } from "@/hooks/useQuestionStats";
import { useResources } from "@/hooks/useResources";
import { HeroSection } from "@/components/HeroSection";
import { Seo } from "@/components/Seo";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Lock, LogIn, UserPlus } from "lucide-react";
import { SignInButton, SignUpButton } from "@clerk/react";

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

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <Seo
        title="Omiyages - Interview Prep for Tech Roles in Japan"
        description="Practice real interview questions, explore hiring jobs, and prepare with curated resources for top tech companies in Japan."
        path="/"
      />
      <HeroSection
        isAdmin={isAdmin}
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        onSubmitSuccess={handleSubmitSuccess}
      />

      <div className="container mx-auto px-4 py-12 flex-1 space-y-16">
        {/* 1. Interview Questions — gated for unauthenticated users */}
        {authLoading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-800 rounded w-64 mb-2"></div>
            <div className="h-4 bg-neutral-800 rounded w-96 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-neutral-900 rounded-xl border border-neutral-800 p-5 space-y-3">
                  <div className="h-4 bg-neutral-800 rounded w-24"></div>
                  <div className="h-5 bg-neutral-800 rounded w-full"></div>
                  <div className="h-5 bg-neutral-800 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        ) : isAuthenticated ? (
          <Suspense fallback={
            <div className="animate-pulse">
              <div className="h-8 bg-neutral-800 rounded w-48 mb-4"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-32 bg-neutral-800 rounded"></div>
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
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Interview Questions</h2>
            <p className="text-muted-foreground mb-8">Practice with real interview questions from top companies.</p>
            <div className="relative">
              {/* Blurred placeholder cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 blur-sm select-none pointer-events-none" aria-hidden="true">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-neutral-900 rounded-xl border border-neutral-800 p-5 space-y-3">
                    <div className="flex gap-2">
                      <span className="bg-orange-900/40 text-orange-400 text-xs px-2 py-0.5 rounded">Technical</span>
                      <span className="bg-neutral-800 text-neutral-400 text-xs px-2 py-0.5 rounded">Company</span>
                    </div>
                    <div className="h-5 bg-neutral-800 rounded w-full"></div>
                    <div className="h-5 bg-neutral-800 rounded w-3/4"></div>
                    <div className="flex gap-2 mt-2">
                      <span className="bg-cyan-900/40 text-cyan-400 text-xs px-2 py-0.5 rounded">Stage</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Login wall overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-700 px-8 py-8 max-w-md w-full mx-4 text-center">
                  <div className="w-12 h-12 bg-primary/15 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Unlock All {stats?.total_count ? stats.total_count : ''} Questions</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Sign in to access all interview questions, detailed answers, and track your progress.
                  </p>
                  <div className="flex gap-3">
                    <SignInButton mode="modal">
                      <Button className="flex-1 btn-cta">
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button variant="outline" className="flex-1 border-neutral-600 text-neutral-200 hover:bg-neutral-800 hover:text-neutral-100">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Register
                      </Button>
                    </SignUpButton>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 2. Courses */}
        <Suspense fallback={
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-800 rounded w-48 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-neutral-900 rounded-xl overflow-hidden">
                  <div className="h-40 bg-neutral-800"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-neutral-800 rounded w-24"></div>
                    <div className="h-5 bg-neutral-800 rounded w-full"></div>
                    <div className="h-4 bg-neutral-800 rounded w-32"></div>
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
            <div className="h-8 bg-neutral-800 rounded w-48 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-neutral-800 rounded"></div>
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
      <footer className="bg-neutral-900 border-t border-neutral-800 mt-auto py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="text-lg font-semibold text-foreground">Omiyages</span>
              <p className="text-sm text-muted-foreground mt-1">Interview preparation for tech roles in Japan.</p>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <Link to="/tracks" className="hover:text-foreground transition-colors">Courses</Link>
              <Link to="/questions" className="hover:text-foreground transition-colors">Questions</Link>
              <Link to="/resources" className="hover:text-foreground transition-colors">Resources</Link>
              <Link to="/jobs" className="hover:text-foreground transition-colors">Jobs</Link>
              <Link to="/company" className="hover:text-foreground transition-colors">Companies</Link>
            </nav>
          </div>
          <div className="border-t border-neutral-800 mt-6 pt-6 text-center text-sm text-muted-foreground">
            &copy; 2026 Omiyages. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
