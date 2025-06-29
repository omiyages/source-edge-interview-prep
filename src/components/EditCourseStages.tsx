
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus } from "lucide-react";

interface CourseStage {
  id: string;
  title: string;
  description: string;
  information: string;
  stage_order: number;
}

interface EditCourseStagesProps {
  stages: CourseStage[];
  onStagesChange: (stages: CourseStage[]) => void;
}

export const EditCourseStages = ({ stages, onStagesChange }: EditCourseStagesProps) => {
  const updateStage = (index: number, field: keyof CourseStage, value: string | number) => {
    const updatedStages = [...stages];
    updatedStages[index] = { ...updatedStages[index], [field]: value };
    onStagesChange(updatedStages);
  };

  const addStage = () => {
    const newStage: CourseStage = {
      id: '', // Will be generated on save
      title: `Stage ${stages.length + 1}`,
      description: "",
      information: "",
      stage_order: stages.length + 1
    };
    onStagesChange([...stages, newStage]);
  };

  const removeStage = (index: number) => {
    const updatedStages = stages.filter((_, i) => i !== index);
    // Update stage orders
    updatedStages.forEach((stage, i) => {
      stage.stage_order = i + 1;
    });
    onStagesChange(updatedStages);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-lg font-semibold">Interview Stages</Label>
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
  );
};
