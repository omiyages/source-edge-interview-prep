
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ManageStageQuestionsForm } from "./ManageStageQuestionsForm";
import { ManageStageResourcesForm } from "./ManageStageResourcesForm";

interface CourseStage {
  title: string;
  description: string;
  information: string;
  stage_order: number;
}

interface StageContentAssignmentProps {
  stages: CourseStage[];
  createdStageIds: string[];
  stageAssignments: Record<string, { questionsAssigned: boolean; resourcesAssigned: boolean }>;
  onAssignmentSuccess: (stageId: string, type: 'questions' | 'resources') => void;
}

export const StageContentAssignment = ({
  stages,
  createdStageIds,
  stageAssignments,
  onAssignmentSuccess
}: StageContentAssignmentProps) => {
  return (
    <>
      <p className="text-sm text-gray-600 mb-6">
        Course created successfully! Now assign questions and resources to each stage.
      </p>
      
      <div className="space-y-4">
        {createdStageIds.map((stageId, index) => {
          const stageName = stages[index]?.title || `Stage ${index + 1}`;
          const assignments = stageAssignments[stageId] || { questionsAssigned: false, resourcesAssigned: false };
          
          return (
            <Card key={stageId}>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{stageName}</span>
                  <div className="flex gap-2 text-xs">
                    <span className={`px-2 py-1 rounded ${assignments.questionsAssigned ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      Questions {assignments.questionsAssigned ? '✓' : '○'}
                    </span>
                    <span className={`px-2 py-1 rounded ${assignments.resourcesAssigned ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      Resources {assignments.resourcesAssigned ? '✓' : '○'}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings2 className="w-4 h-4 mr-2" />
                        Manage Questions
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Manage Questions for {stageName}</DialogTitle>
                      </DialogHeader>
                      <ManageStageQuestionsForm 
                        stageId={stageId}
                        onSuccess={() => onAssignmentSuccess(stageId, 'questions')}
                      />
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings2 className="w-4 h-4 mr-2" />
                        Manage Resources
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Manage Resources for {stageName}</DialogTitle>
                      </DialogHeader>
                      <ManageStageResourcesForm 
                        stageId={stageId}
                        onSuccess={() => onAssignmentSuccess(stageId, 'resources')}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
};
