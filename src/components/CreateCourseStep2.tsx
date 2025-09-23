
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StickyFormActions } from "@/components/ui/sticky-form-actions";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StageDefinitionForm } from "./StageDefinitionForm";
import { StageContentAssignment } from "./StageContentAssignment";

interface CourseStage {
  title: string;
  description: string;
  information: string;
  stage_order: number;
}

interface CourseData {
  title: string;
  description: string;
}

interface CreateCourseStep2Props {
  courseData: CourseData;
  stages: CourseStage[];
  setStages: (stages: CourseStage[]) => void;
  createdCourseId: string | null;
  createdStageIds: string[];
  stageAssignments: Record<string, { questionsAssigned: boolean; resourcesAssigned: boolean }>;
  isSubmitting: boolean;
  onBack: () => void;
  onCreateCourse: () => void;
  onFinish: () => void;
  onAssignmentSuccess: (stageId: string, type: 'questions' | 'resources') => void;
}

export const CreateCourseStep2 = ({
  courseData,
  stages,
  setStages,
  createdCourseId,
  createdStageIds,
  stageAssignments,
  isSubmitting,
  onBack,
  onCreateCourse,
  onFinish,
  onAssignmentSuccess
}: CreateCourseStep2Props) => {
  const { toast } = useToast();

  const allStagesConfigured = createdStageIds.every(stageId => 
    stageAssignments[stageId]?.questionsAssigned && stageAssignments[stageId]?.resourcesAssigned
  );

  const handleCreateCourse = () => {
    if (stages.some(stage => !stage.title.trim())) {
      toast({
        title: "Error",
        description: "All stages must have a title.",
        variant: "destructive",
      });
      return;
    }

    onCreateCourse();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Step 2: Interview Stages & Content Assignment</h3>
        
        {!createdCourseId ? (
          <>
            <StageDefinitionForm 
              stages={stages}
              setStages={setStages}
            />

            <StickyFormActions>
              <div className="flex w-full justify-between">
                <Button variant="outline" onClick={onBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleCreateCourse} disabled={isSubmitting}>
                  {isSubmitting ? "Creating Course..." : "Create Course & Configure Content"}
                </Button>
              </div>
            </StickyFormActions>
          </>
        ) : (
          <>
            <StageContentAssignment 
              stages={stages}
              createdStageIds={createdStageIds}
              stageAssignments={stageAssignments}
              onAssignmentSuccess={onAssignmentSuccess}
            />

            <StickyFormActions>
              <div className="flex w-full justify-between">
                <Button variant="outline" onClick={onBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Course Info
                </Button>
                <Button 
                  onClick={onFinish}
                  disabled={!allStagesConfigured}
                  className={allStagesConfigured ? "" : "opacity-50"}
                >
                  {allStagesConfigured ? "Complete Course Setup" : "Assign Content to All Stages"}
                </Button>
              </div>
            </StickyFormActions>
          </>
        )}
      </div>
    </div>
  );
};
