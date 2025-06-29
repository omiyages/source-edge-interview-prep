
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus, ArrowRight, ArrowLeft, Settings2 } from "lucide-react";
import { ManageStageQuestionsForm } from "./ManageStageQuestionsForm";
import { ManageStageResourcesForm } from "./ManageStageResourcesForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CourseStage {
  title: string;
  description: string;
  information: string;
  stage_order: number;
}

interface CreateCourseWorkflowProps {
  onSuccess: () => void;
}

export const CreateCourseWorkflow = ({ onSuccess }: CreateCourseWorkflowProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [createdStageIds, setCreatedStageIds] = useState<string[]>([]);
  const [stageAssignments, setStageAssignments] = useState<Record<string, { questionsAssigned: boolean; resourcesAssigned: boolean }>>({});
  
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
  });
  
  const [stages, setStages] = useState<CourseStage[]>([
    {
      title: "Stage 1",
      description: "",
      information: "",
      stage_order: 1
    }
  ]);

  const updateStage = (index: number, field: keyof CourseStage, value: string | number) => {
    const updatedStages = [...stages];
    updatedStages[index] = { ...updatedStages[index], [field]: value };
    setStages(updatedStages);
  };

  const addStage = () => {
    const newStage: CourseStage = {
      title: `Stage ${stages.length + 1}`,
      description: "",
      information: "",
      stage_order: stages.length + 1
    };
    setStages([...stages, newStage]);
  };

  const removeStage = (index: number) => {
    if (stages.length === 1) return;
    const updatedStages = stages.filter((_, i) => i !== index);
    updatedStages.forEach((stage, i) => {
      stage.stage_order = i + 1;
    });
    setStages(updatedStages);
  };

  const handleStep1Next = async () => {
    if (!courseData.title.trim()) {
      toast({
        title: "Error",
        description: "Course title is required.",
        variant: "destructive",
      });
      return;
    }

    setCurrentStep(2);
  };

  const handleCreateCourse = async () => {
    if (stages.some(stage => !stage.title.trim())) {
      toast({
        title: "Error",
        description: "All stages must have a title.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the course
      const { data: courseData_, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: courseData.title,
          description: courseData.description,
          created_by: user?.id,
        })
        .select()
        .single();

      if (courseError) throw courseError;
      setCreatedCourseId(courseData_.id);

      // Create the stages
      const stageInserts = stages.map((stage, index) => ({
        course_id: courseData_.id,
        title: stage.title,
        description: stage.description,
        information: stage.information,
        stage_order: index + 1,
      }));

      const { data: stagesData, error: stagesError } = await supabase
        .from('course_stages')
        .insert(stageInserts)
        .select();

      if (stagesError) throw stagesError;
      
      const stageIds = stagesData.map(stage => stage.id);
      setCreatedStageIds(stageIds);

      // Initialize stage assignments tracking
      const initialAssignments: Record<string, { questionsAssigned: boolean; resourcesAssigned: boolean }> = {};
      stageIds.forEach(id => {
        initialAssignments[id] = { questionsAssigned: false, resourcesAssigned: false };
      });
      setStageAssignments(initialAssignments);

      toast({
        title: "Course Created!",
        description: "Course and stages created successfully. You can now assign questions and resources to each stage.",
      });
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignmentSuccess = (stageId: string, type: 'questions' | 'resources') => {
    setStageAssignments(prev => ({
      ...prev,
      [stageId]: {
        ...prev[stageId],
        [`${type}Assigned`]: true
      }
    }));
  };

  const handleFinish = () => {
    toast({
      title: "Course Setup Complete!",
      description: "Your course has been created successfully with all stages and assignments.",
    });
    onSuccess();
  };

  const allStagesConfigured = createdStageIds.every(stageId => 
    stageAssignments[stageId]?.questionsAssigned && stageAssignments[stageId]?.resourcesAssigned
  );

  if (currentStep === 1) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Step 1: Course Information</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Google Software Engineer Prep"
                value={courseData.title}
                onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Course Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of what this course covers..."
                value={courseData.description}
                onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleStep1Next}>
            Next: Configure Stages
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Step 2: Interview Stages & Content Assignment</h3>
          
          {!createdCourseId ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <Label className="text-sm font-medium">Define your interview stages</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addStage}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Stage
                </Button>
              </div>

              <div className="space-y-4 mb-6">
                {stages.map((stage, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm">Stage {index + 1}</CardTitle>
                        {stages.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeStage(index)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`stage-title-${index}`}>Stage Title *</Label>
                          <Input
                            id={`stage-title-${index}`}
                            placeholder="e.g., Technical Assessment"
                            value={stage.title}
                            onChange={(e) => updateStage(index, 'title', e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`stage-description-${index}`}>Short Description</Label>
                          <Input
                            id={`stage-description-${index}`}
                            placeholder="Brief description..."
                            value={stage.description}
                            onChange={(e) => updateStage(index, 'description', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`stage-information-${index}`}>
                          Detailed Information
                          <span className="text-xs text-gray-500 ml-2">
                            (Use **text** for bold, line breaks for formatting)
                          </span>
                        </Label>
                        <Textarea
                          id={`stage-information-${index}`}
                          placeholder="Detailed information about this stage, preparation tips, what to expect, etc. Use **bold text** for emphasis..."
                          value={stage.information}
                          onChange={(e) => updateStage(index, 'information', e.target.value)}
                          rows={4}
                          className="font-mono text-sm"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleCreateCourse} disabled={isSubmitting}>
                  {isSubmitting ? "Creating Course..." : "Create Course & Configure Content"}
                </Button>
              </div>
            </>
          ) : (
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
                                onSuccess={() => handleAssignmentSuccess(stageId, 'questions')}
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
                                onSuccess={() => handleAssignmentSuccess(stageId, 'resources')}
                              />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Course Info
                </Button>
                <Button 
                  onClick={handleFinish}
                  disabled={!allStagesConfigured}
                  className={allStagesConfigured ? "" : "opacity-50"}
                >
                  {allStagesConfigured ? "Complete Course Setup" : "Assign Content to All Stages"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
};
