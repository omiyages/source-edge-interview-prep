
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, MessageSquare, Lock, LogIn, UserPlus } from "lucide-react";
import { SignInButton, SignUpButton } from "@clerk/react";
import { CourseHeader } from "@/components/CourseHeader";
import { StageNavigation } from "@/components/StageNavigation";
import { CourseProgress } from "@/components/CourseProgress";
import { StageCompleteButton } from "@/components/StageCompleteButton";
import { CourseContentSection } from "@/components/CourseContentSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ManageStageResourcesTable } from "@/components/ManageStageResourcesTable";
import { ManageStageQuestionsForm } from "@/components/ManageStageQuestionsForm";
import { CourseReviewForm } from "@/components/CourseReviewForm";
import { useCourseData, useStageQuestions, useUserProgress, useBatchStageQuestions } from "@/hooks/useCourseData";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { NavigationHeader } from "@/components/NavigationHeader";
import { useCourseAssignment } from "@/hooks/useCourseAssignment";
import { CoursePaywall } from "@/components/CoursePaywall";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const isAuthenticated = !loading && !!user;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStage, setSelectedStage] = useState<CourseStage | null>(null);
  const [showResourcesDialog, setShowResourcesDialog] = useState(false);
  const [showQuestionsDialog, setShowQuestionsDialog] = useState(false);
  const [showCourseContent, setShowCourseContent] = useState(false);

  // Custom hooks for data fetching
  const { course, stages, refetchCourse, refetchStages, isLoadingCourse } = useCourseData(slug, user);
  // Batch-fetch all stage questions in one query (instead of N+1 per stage)
  const stageIds = stages?.map(s => s.id) || [];
  const { questionsByStage } = useBatchStageQuestions(stageIds);
  // Derive current stage's questions from the batch result
  const stageQuestions = selectedStage ? (questionsByStage[selectedStage.id] || []) : [];
  // Refetch all stage questions (after admin edits)
  const refetchQuestions = () => queryClient.invalidateQueries({ queryKey: ['batch-stage-questions'] });
  const { userProgress } = useUserProgress(user, course?.id);
  const { isAssigned, isLoading: isLoadingAssignment, startCourse, isStarting } = useCourseAssignment(course?.id);

  // Count total questions across all stages
  const { data: totalQuestionsCount = 0 } = useQuery({
    queryKey: ['course-total-questions', course?.id],
    queryFn: async () => {
      if (!course?.id || !stages || stages.length === 0) return 0;
      
      const stageIds = stages.map(s => s.id);
      const { count, error } = await supabase
        .from('stage_questions')
        .select('*', { count: 'exact', head: true })
        .in('stage_id', stageIds);
        
      if (error) {
        console.error('Error counting questions:', error);
        return 0;
      }
      return count || 0;
    },
    enabled: !!course?.id && !!stages && stages.length > 0,
  });

  const handleStartCourse = async () => {
    try {
      await startCourse();
      // Wait a bit for the database to update, then refetch
      await new Promise(resolve => setTimeout(resolve, 100));
      await queryClient.invalidateQueries({ queryKey: ['course-assignment'] });
      await queryClient.refetchQueries({ queryKey: ['course-assignment', course?.id, user?.id] });
      toast({
        title: "Course Started!",
        description: "You can now access all course content.",
      });
    } catch (error: any) {
      console.error('Error starting course:', error);
      toast({
        title: "Failed to Start Course",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  if (loading || isLoadingCourse || isLoadingAssignment) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col">
        <NavigationHeader />
        <div className="flex items-center justify-center flex-1">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading course...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col">
        <NavigationHeader />
        <div className="flex items-center justify-center flex-1">
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
      </div>
    );
  }

  // Show login wall for unauthenticated users
  const showLoginWall = !isAuthenticated && course && stages;
  // Show paywall if course is not assigned and user is not admin (only for authenticated users)
  const showPaywall = isAuthenticated && !isAdmin && !isAssigned && course && stages;

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8 flex-1">
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

        {showLoginWall ? (
          <>
            <StageNavigation
              stages={stages || []}
              selectedStage={selectedStage}
              onStageSelect={setSelectedStage}
            />
            <div className="relative mt-6">
              {/* Blurred placeholder content */}
              <div className="blur-sm select-none pointer-events-none space-y-4" aria-hidden="true">
                <div className="bg-neutral-900 rounded-lg border p-6 space-y-3">
                  <div className="h-6 bg-neutral-700 rounded w-1/3"></div>
                  <div className="h-4 bg-neutral-800 rounded w-full"></div>
                  <div className="h-4 bg-neutral-800 rounded w-5/6"></div>
                  <div className="h-4 bg-neutral-800 rounded w-2/3"></div>
                </div>
                <div className="bg-neutral-900 rounded-lg border p-6 space-y-3">
                  <div className="h-6 bg-neutral-700 rounded w-1/4"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-neutral-800 rounded"></div>
                    <div className="h-20 bg-neutral-800 rounded"></div>
                  </div>
                </div>
                <div className="bg-neutral-900 rounded-lg border p-6 space-y-3">
                  <div className="h-6 bg-neutral-700 rounded w-1/3"></div>
                  <div className="h-4 bg-neutral-800 rounded w-full"></div>
                  <div className="h-4 bg-neutral-800 rounded w-4/5"></div>
                </div>
              </div>

              {/* Login wall overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-neutral-900 rounded-2xl shadow-2xl shadow-black/20 border border-neutral-800 px-8 py-8 max-w-md w-full mx-4 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Unlock Course Content</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Sign in to access course stages, questions, resources, and track your progress.
                  </p>
                  <div className="flex gap-3">
                    <SignInButton mode="modal">
                      <Button className="flex-1 btn-cta">
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button variant="outline" className="flex-1">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Register
                      </Button>
                    </SignUpButton>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : showPaywall ? (
          <CoursePaywall
            courseTitle={course.title}
            companyName={course.company}
            stagesCount={stages?.length || 0}
            questionsCount={totalQuestionsCount}
            onStartCourse={handleStartCourse}
            isStarting={isStarting}
          />
        ) : (
          <>
        {/* Progress Bar */}
        <CourseProgress 
          userProgress={userProgress}
          stages={stages}
          isAdmin={isAdmin}
        />

            <div className="mb-6">
              <StageNavigation
                stages={stages || []}
                selectedStage={selectedStage}
                onStageSelect={setSelectedStage}
              />
        </div>

        {/* Selected Stage Content or Course Review */}
        {allStagesCompleted && !showCourseContent ? (
          <div className="space-y-8">
            <div className="text-center py-8 bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-lg border border-green-800">
              <h2 className="text-2xl font-bold text-green-400 mb-2">
                🎉 Congratulations!
              </h2>
              <p className="text-green-400 mb-4">
                You've completed all stages of this course. Please share your feedback below.
              </p>
              <Button
                onClick={() => setShowCourseContent(true)}
                variant="outline"
                className="mt-4"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                View Course Again
              </Button>
            </div>
            
            <CourseReviewForm
              courseId={course.id}
              stages={stages || []}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {allStagesCompleted && showCourseContent && (
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowCourseContent(false)}
                  variant="outline"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  View Feedback
                </Button>
              </div>
            )}
            <CourseContentSection
              selectedStage={selectedStage}
              stageQuestions={stageQuestions}
              isAdmin={isAdmin}
              onManageResourcesClick={() => setShowResourcesDialog(true)}
              onManageQuestionsClick={() => setShowQuestionsDialog(true)}
              onQuestionsUpdate={refetchQuestions}
              stageCompleteButton={
                <StageCompleteButton
                  selectedStage={selectedStage}
                  courseId={course?.id!}
                  userProgress={userProgress}
                  isAdmin={isAdmin}
                />
              }
            />
          </div>
        )}
          </>
        )}

        {/* Manage Resources Dialog */}
        <Dialog open={showResourcesDialog} onOpenChange={setShowResourcesDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Resources for {selectedStage?.title}</DialogTitle>
            </DialogHeader>
            {selectedStage && (
              <ManageStageResourcesTable
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

      {/* Footer */}
      <footer className="bg-neutral-900 border-t border-border/30 mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 Omiyages. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default CourseDetail;
