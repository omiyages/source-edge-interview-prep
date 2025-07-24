
import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuestions } from "@/hooks/useQuestions";
import { useResources } from "@/hooks/useResources";
import { HeroSection } from "@/components/HeroSection";
import { ResourcesPreview } from "@/components/ResourcesPreview";
import { QuestionsSection } from "@/components/QuestionsSection";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
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
        <ResourcesPreview 
          resources={resources}
          loading={resourcesLoading}
        />

        <QuestionsSection 
          questions={questions}
          loading={questionsLoading}
          error={questionsError}
        />
      </div>
    </div>
  );
};

export default Index;
