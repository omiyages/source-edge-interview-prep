
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuestions } from "@/hooks/useQuestions";
import { useResources } from "@/hooks/useResources";
import { HeroSection } from "@/components/HeroSection";
import { ResourcesPreview } from "@/components/ResourcesPreview";
import { QuestionsSection } from "@/components/QuestionsSection";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Settings, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const { user, isAdmin, loading: authLoading, profile, signOut } = useAuth();
  const { toast } = useToast();
  
  console.log('🏡 Index page state:', { 
    user: user?.email, 
    isAdmin, 
    authLoading, 
    profileRole: profile?.role 
  });
  
  // Only fetch data when user is authenticated and not loading
  const shouldFetchData = !authLoading && !!user;
  const { questions, loading: questionsLoading, error: questionsError, refetch: refetchQuestions } = useQuestions(isAdmin, shouldFetchData);
  const { resources, loading: resourcesLoading } = useResources(shouldFetchData);
  
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSubmitSuccess = () => {
    setDialogOpen(false);
    toast({
      title: "Question submitted!",
      description: "Your question has been submitted for review.",
    });
    refetchQuestions();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Admin Navigation */}
      {isAdmin && (
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-2">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Logged in as Admin: {profile?.email}
              </div>
              <div className="flex gap-2">
                <Link to="/admin">
                  <Button className="bg-purple-gradient hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 transition-all duration-300 text-white font-medium">
                    <Settings className="w-4 h-4 mr-2" />
                    Admin Dashboard
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <HeroSection 
          isAdmin={isAdmin}
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
          onSubmitSuccess={handleSubmitSuccess}
        />

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
