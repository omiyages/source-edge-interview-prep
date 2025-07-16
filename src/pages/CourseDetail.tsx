
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CourseHeader } from "@/components/CourseHeader";
import { StageNavigation } from "@/components/StageNavigation";
import { CourseProgress } from "@/components/CourseProgress";
import { StageCompleteButton } from "@/components/StageCompleteButton";
import { CourseContentSection } from "@/components/CourseContentSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ManageStageResourcesForm } from "@/components/ManageStageResourcesForm";
import { ManageStageQuestionsForm } from "@/components/ManageStageQuestionsForm";
import { useCourseData, useStageQuestions, useUserProgress } from "@/hooks/useCourseData";

interface CourseStage {
  id: string;
  title: string;
  description: string | null;
  information: string | null;
  stage_order: number;
}

const CourseDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading, isAdmin } = useAuth();
  const [selectedStage, setSelectedStage] = useState<CourseStage | null>(null);
  const [showResourcesDialog, setShowResourcesDialog] = useState(false);
  const [showQuestionsDialog, setShowQuestionsDialog] = useState(false);

  // Redirect to auth if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Custom hooks for data fetching
  const { course, stages, refetchCourse, refetchStages, isLoadingCourse } = useCourseData(slug, user);
  const { stageQuestions, refetchQuestions } = useStageQuestions(selectedStage);
  const { userProgress } = useUserProgress(user, course?.id);

  useEffect(() => {
    if (stages && stages.length > 0 && !selectedStage) {
      setSelectedStage(stages[0]);
    }
  }, [stages, selectedStage]);

  if (loading || isLoadingCourse) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
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
    <div className="min-h-screen bg-white">
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
        <CourseProgress 
          userProgress={userProgress}
          stages={stages}
          isAdmin={isAdmin}
        />

        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <StageNavigation
                stages={stages || []}
                selectedStage={selectedStage}
                onStageSelect={setSelectedStage}
              />
            </div>
            
            {/* Complete Stage Button - always visible but responsive positioning */}
            <div className="md:flex-shrink-0">
              <StageCompleteButton
                selectedStage={selectedStage}
                courseId={course?.id!}
                userProgress={userProgress}
                isAdmin={isAdmin}
              />
            </div>
          </div>
        </div>

        {/* Selected Stage Content */}
        <CourseContentSection
          selectedStage={selectedStage}
          stageQuestions={stageQuestions}
          isAdmin={isAdmin}
          onManageResourcesClick={() => setShowResourcesDialog(true)}
          onManageQuestionsClick={() => setShowQuestionsDialog(true)}
          onQuestionsUpdate={refetchQuestions}
        />

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
