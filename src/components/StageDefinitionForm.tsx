
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

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

  return (
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
                <Textarea
                  id={`stage-description-${index}`}
                  placeholder="Brief description..."
                  value={stage.description}
                  onChange={(e) => updateStage(index, 'description', e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`stage-information-${index}`}>
                  Detailed Information
                </Label>
                <RichTextEditor
                  value={stage.information}
                  onChange={(value) => updateStage(index, 'information', value)}
                  placeholder="Detailed information about this stage, preparation tips, what to expect, etc..."
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};
