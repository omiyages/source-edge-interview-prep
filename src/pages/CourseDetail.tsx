
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CourseHeader } from "@/components/CourseHeader";
import { StageNavigation } from "@/components/StageNavigation";
import { StageInformation } from "@/components/StageInformation";
import { StageResourcesSection } from "@/components/StageResourcesSection";
import { StageQuestions } from "@/components/StageQuestions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ManageStageResourcesForm } from "@/components/ManageStageResourcesForm";
import { ManageStageQuestionsForm } from "@/components/ManageStageQuestionsForm";
import { Progress } from "@/components/ui/progress";
import { CheckCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

interface CourseStage {
  id: string;
  title: string;
  description: string | null;
  information: string | null;
  stage_order: number;
}

interface InterviewQuestion {
  id: string;
  question: string;
  company: string;
  role: string;
  interview_stage: string;
  category: string;
  submitted_by: string | null;
  additional_context: string | null;
  created_at: string;
  question_type: string;
  source_url: string | null;
  source_website: string | null;
  scraped_at: string | null;
}

const CourseDetail = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const { user, loading, isAdmin } = useAuth();
  const [selectedStage, setSelectedStage] = useState<CourseStage | null>(null);
  const [showResourcesDialog, setShowResourcesDialog] = useState(false);
  const [showQuestionsDialog, setShowQuestionsDialog] = useState(false);

  // Redirect to auth if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  const { data: course, refetch: refetchCourse, isLoading: isLoadingCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      console.log('🔄 Fetching course with ID:', courseId);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (error) {
        console.error('❌ Error fetching course:', error);
        throw error;
      }
      console.log('✅ Course fetched:', data);
      return data as Course;
    },
    enabled: !!user && !!courseId,
  });

  const { data: stages, refetch: refetchStages } = useQuery({
    queryKey: ['course-stages', courseId],
    queryFn: async () => {
      console.log('🔄 Fetching stages for course:', courseId);
      const { data, error } = await supabase
        .from('course_stages')
        .select('*')
        .eq('course_id', courseId)
        .order('stage_order');
      
      if (error) {
        console.error('❌ Error fetching stages:', error);
        throw error;
      }
      console.log('✅ Stages fetched:', data?.length || 0);
      return data as CourseStage[];
    },
    enabled: !!user && !!courseId,
  });

  const { data: stageQuestions, refetch: refetchQuestions } = useQuery({
    queryKey: ['stage-questions', selectedStage?.id],
    queryFn: async () => {
      if (!selectedStage) return [];
      
      console.log('🔄 Fetching questions for stage:', selectedStage.id);
      const { data, error } = await supabase
        .from('stage_questions')
        .select(`
          question_id,
          interview_questions (*)
        `)
        .eq('stage_id', selectedStage.id);
      
      if (error) {
        console.error('❌ Error fetching stage questions:', error);
        throw error;
      }
      console.log('✅ Stage questions fetched:', data?.length || 0);
      return data.map(item => item.interview_questions) as InterviewQuestion[];
    },
    enabled: !!selectedStage,
  });

  const { data: userProgress } = useQuery({
    queryKey: ['user-progress', courseId, user?.id],
    queryFn: async () => {
      if (!user || !courseId) return [];
      
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId);
      
      if (error) {
        console.error('❌ Error fetching user progress:', error);
        throw error;
      }
      return data;
    },
    enabled: !!user && !!courseId,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const completeStageMutation = useMutation({
    mutationFn: async (stageId: string) => {
      if (!user || !courseId) throw new Error("Missing user or course ID");

      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          stage_id: stageId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Stage completed!",
        description: "Great job! You've completed this stage.",
      });
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error completing stage",
        description: error.message || "Failed to mark stage as complete.",
        variant: "destructive",
      });
    },
  });

  const isStageCompleted = (stageId: string) => {
    return userProgress?.some(p => p.stage_id === stageId) || false;
  };

  const getProgressPercentage = () => {
    if (!stages?.length || !userProgress?.length) return 0;
    return Math.round((userProgress.length / stages.length) * 100);
  };

  useEffect(() => {
    if (stages && stages.length > 0 && !selectedStage) {
      setSelectedStage(stages[0]);
    }
  }, [stages, selectedStage]);

  if (loading || isLoadingCourse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h1>
          <p className="text-gray-600 mb-4">The course you're looking for doesn't exist or may have been removed.</p>
          <Link to="/tracks">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tracks
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <CourseHeader
          course={course}
          selectedStage={selectedStage}
          isAdmin={isAdmin}
          onCourseUpdate={() => {
            refetchCourse();
            refetchStages();
          }}
          onQuestionsUpdate={refetchQuestions}
        />

        {/* Progress Bar */}
        {!isAdmin && stages && stages.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Course Progress</h3>
              <span className="text-sm text-gray-600">{getProgressPercentage()}% Complete</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-3" />
            <p className="text-sm text-gray-600 mt-1">
              {userProgress?.length || 0} of {stages.length} stages completed
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <StageNavigation
            stages={stages || []}
            selectedStage={selectedStage}
            onStageSelect={setSelectedStage}
          />
          
          {/* Complete Stage Button */}
          {!isAdmin && selectedStage && (
            <Button
              onClick={() => completeStageMutation.mutate(selectedStage.id)}
              disabled={completeStageMutation.isPending || isStageCompleted(selectedStage.id)}
              variant={isStageCompleted(selectedStage.id) ? "outline" : "default"}
              className="ml-4 flex items-center gap-2"
            >
              {isStageCompleted(selectedStage.id) ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Completed
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  {completeStageMutation.isPending ? "Completing..." : "Complete Stage"}
                </>
              )}
            </Button>
          )}
        </div>

        {/* Selected Stage Content */}
        {selectedStage && (
          <div className="space-y-8">
            <StageInformation selectedStage={selectedStage} />

            <StageResourcesSection
              stageId={selectedStage.id}
              isAdmin={isAdmin}
              onManageClick={() => setShowResourcesDialog(true)}
            />

            <StageQuestions
              questions={stageQuestions}
              isAdmin={isAdmin}
              onManageClick={() => setShowQuestionsDialog(true)}
            />
          </div>
        )}

        {/* Manage Resources Dialog */}
        <Dialog open={showResourcesDialog} onOpenChange={setShowResourcesDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Resources for {selectedStage?.title}</DialogTitle>
            </DialogHeader>
            {selectedStage && (
              <ManageStageResourcesForm
                stageId={selectedStage.id}
                onSuccess={() => setShowResourcesDialog(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Manage Questions Dialog */}
        <Dialog open={showQuestionsDialog} onOpenChange={setShowQuestionsDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Questions for {selectedStage?.title}</DialogTitle>
            </DialogHeader>
            {selectedStage && (
              <ManageStageQuestionsForm
                stageId={selectedStage.id}
                onSuccess={() => setShowQuestionsDialog(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CourseDetail;
