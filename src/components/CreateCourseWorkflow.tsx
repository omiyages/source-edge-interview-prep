
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus, ArrowRight, ArrowLeft } from "lucide-react";
import { ManageStageQuestionsForm } from "./ManageStageQuestionsForm";
import { ManageStageResourcesForm } from "./ManageStageResourcesForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  
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

  const handleStep2Next = async () => {
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
      setCreatedStageIds(stagesData.map(stage => stage.id));

      setCurrentStep(3);
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

  const handleFinish = () => {
    toast({
      title: "Course Created!",
      description: "Your course has been created successfully with all stages and assignments.",
    });
    onSuccess();
  };

  const handleStageAssignmentComplete = () => {
    if (currentStageIndex < createdStageIds.length - 1) {
      setCurrentStageIndex(currentStageIndex + 1);
    } else {
      handleFinish();
    }
  };

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
            Next: Add Stages
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
          <h3 className="text-lg font-semibold mb-4">Step 2: Interview Stages</h3>
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

          <div className="space-y-4">
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
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleStep2Next} disabled={isSubmitting}>
            {isSubmitting ? "Creating Course..." : "Next: Assign Content"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  if (currentStep === 3 && createdStageIds.length > 0) {
    const currentStageId = createdStageIds[currentStageIndex];
    const stageName = stages[currentStageIndex]?.title || `Stage ${currentStageIndex + 1}`;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Step 3: Assign Questions & Resources
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Stage {currentStageIndex + 1} of {createdStageIds.length}: {stageName}
          </p>
          
          <Tabs defaultValue="questions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>
            
            <TabsContent value="questions" className="mt-6">
              <ManageStageQuestionsForm
                stageId={currentStageId}
                onSuccess={() => {}}
              />
            </TabsContent>
            
            <TabsContent value="resources" className="mt-6">
              <ManageStageResourcesForm
                stageId={currentStageId}
                onSuccess={() => {}}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => currentStageIndex > 0 ? setCurrentStageIndex(currentStageIndex - 1) : setCurrentStep(2)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStageIndex > 0 ? "Previous Stage" : "Back to Stages"}
          </Button>
          <Button onClick={handleStageAssignmentComplete}>
            {currentStageIndex < createdStageIds.length - 1 ? "Next Stage" : "Finish Course"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
