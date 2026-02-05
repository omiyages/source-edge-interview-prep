
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Plus, Trash2, Save } from "lucide-react";
import { StageTemplateDialog } from "@/components/StageTemplateDialog";
import { StageTemplateSelector } from "@/components/StageTemplateSelector";

interface CourseStage {
  title: string;
  description: string;
  information: string;
  stage_order: number;
}

interface StageDefinitionFormProps {
  stages: CourseStage[];
  setStages: (stages: CourseStage[]) => void;
}

export const StageDefinitionForm = ({ stages, setStages }: StageDefinitionFormProps) => {
  const updateStage = (index: number, field: keyof CourseStage, value: string | number) => {
    const newStages = [...stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setStages(newStages);
  };

  const addStage = () => {
    const newStage: CourseStage = {
      title: "",
      description: "",
      information: "",
      stage_order: stages.length + 1,
    };
    setStages([...stages, newStage]);
  };

  const removeStage = (index: number) => {
    if (stages.length <= 1) return;
    const newStages = stages.filter((_, i) => i !== index);
    // Update stage orders
    newStages.forEach((stage, i) => {
      stage.stage_order = i + 1;
    });
    setStages(newStages);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-md font-medium">Define Interview Stages</h4>
        <Button onClick={addStage} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Stage
        </Button>
      </div>

      {stages.map((stage, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h5 className="font-medium">Stage {stage.stage_order}</h5>
            <div className="flex items-center gap-2">
              <StageTemplateDialog stage={stage}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  title="Save as template"
                >
                  <Save className="w-4 h-4" />
                </Button>
              </StageTemplateDialog>
              {stages.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStage(index)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <StageTemplateSelector
              onApplyTemplate={(templateData) => {
                const newStages = [...stages];
                newStages[index] = { ...newStages[index], ...templateData };
                setStages(newStages);
              }}
            />
            
            <div>
              <Label htmlFor={`title-${index}`}>Stage Title</Label>
              <Input
                id={`title-${index}`}
                value={stage.title}
                onChange={(e) => updateStage(index, "title", e.target.value)}
                placeholder="e.g., Phone Screening, Technical Interview"
              />
            </div>

            <div>
              <Label htmlFor={`description-${index}`}>Stage Description</Label>
              <Input
                id={`description-${index}`}
                value={stage.description}
                onChange={(e) => updateStage(index, "description", e.target.value)}
                placeholder="Brief description of this stage"
              />
            </div>

            <div>
              <Label htmlFor={`information-${index}`}>Detailed Information</Label>
              <div className="min-h-[250px]">
                <RichTextEditor
                  value={stage.information}
                  onChange={(value) => updateStage(index, "information", value)}
                  placeholder="Detailed information about this stage, expectations, and guidelines"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
