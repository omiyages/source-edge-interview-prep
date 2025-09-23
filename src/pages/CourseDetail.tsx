
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
import { CourseReviewForm } from "@/components/CourseReviewForm";
import { useCourseData, useStageQuestions, useUserProgress } from "@/hooks/useCourseData";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

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

  // Check if all stages are completed
  const allStagesCompleted = stages && userProgress && stages.length > 0 
    ? stages.every(stage => 
        userProgress.some(progress => progress.stage_id === stage.id)
      )
    : false;

  useEffect(() => {
    if (stages && stages.length > 0 && !selectedStage) {
      setSelectedStage(stages[0]);
    }
  }, [stages, selectedStage]);

  if (loading || isLoadingCourse) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Course not found</h1>
          <p className="text-muted-foreground mb-4">The course you're looking for doesn't exist or may have been removed.</p>
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Tracks', href: '/tracks' }, { label: course?.title || 'Course' }]} className="mb-4" />
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

        {/* Selected Stage Content or Course Review */}
        {allStagesCompleted ? (
          <div className="space-y-8">
            <div className="text-center py-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-lg border border-green-200 dark:border-green-800">
              <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">
                🎉 Congratulations!
              </h2>
              <p className="text-green-700 dark:text-green-400">
                You've completed all stages of this course. Please share your feedback below.
              </p>
            </div>
            
            <CourseReviewForm
              courseId={course.id}
              stages={stages || []}
            />
          </div>
        ) : (
          <CourseContentSection
            selectedStage={selectedStage}
            stageQuestions={stageQuestions}
            isAdmin={isAdmin}
            onManageResourcesClick={() => setShowResourcesDialog(true)}
            onManageQuestionsClick={() => setShowQuestionsDialog(true)}
            onQuestionsUpdate={refetchQuestions}
          />
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
