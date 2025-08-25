
import React, { useState, useCallback, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuestions } from "@/hooks/useQuestions";
import { useResources } from "@/hooks/useResources";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { HeroSection } from "@/components/HeroSection";
import { useToast } from "@/hooks/use-toast";

// Lazy load non-critical components
const ResourcesPreview = React.lazy(() => import("@/components/ResourcesPreview").then(module => ({ default: module.ResourcesPreview })));
const QuestionsSection = React.lazy(() => import("@/components/QuestionsSection").then(module => ({ default: module.QuestionsSection })));

const Index = () => {
  usePerformanceMonitor('Index');
  
  const { user, isAdmin, loading: authLoading, profile } = useAuth();
  const { toast } = useToast();
  
  // Only fetch data when user is authenticated and not loading
  const shouldFetchData = !authLoading && !!user;
  const { questions, loading: questionsLoading, error: questionsError, refetch: refetchQuestions } = useQuestions(isAdmin, shouldFetchData);
  const { resources, loading: resourcesLoading } = useResources(shouldFetchData);
  
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSubmitSuccess = useCallback(() => {
    setDialogOpen(false);
    toast({
      title: "Question submitted!",
      description: "Your question has been submitted for review.",
    });
    refetchQuestions();
  }, [toast, refetchQuestions]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-semibold">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HeroSection 
        isAdmin={isAdmin}
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        onSubmitSuccess={handleSubmitSuccess}
      />

      <div className="container mx-auto px-4 py-8">
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
      </div>
    </div>
  );
};

export default Index;
