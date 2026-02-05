// ABOUTME: Component for selecting and applying stage templates from a dropdown
// ABOUTME: Shows available templates and applies selected template data to current stage

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BookTemplate } from "lucide-react";
import { useStageTemplates, StageTemplate } from "@/hooks/useStageTemplates";

interface StageTemplateSelectorProps {
  onApplyTemplate: (template: Partial<import("@/hooks/useStageTemplates").CourseStage>) => void;
}

export const StageTemplateSelector = ({ onApplyTemplate }: StageTemplateSelectorProps) => {
  const { templates, isLoading, applyTemplate } = useStageTemplates();

  const handleApplyTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      const templateData = applyTemplate(template);
      onApplyTemplate(templateData);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Load Template</Label>
        <div className="animate-pulse bg-muted h-10 rounded-md"></div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Load Template</Label>
        <p className="text-sm text-muted-foreground">No templates saved yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground">Load Template</Label>
      <Select onValueChange={handleApplyTemplate}>
        <SelectTrigger>
          <SelectValue placeholder="Choose a template to apply..." />
        </SelectTrigger>
        <SelectContent>
          {templates.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              <div className="flex items-center">
                <BookTemplate className="w-4 h-4 mr-2" />
                <div>
                  <div className="font-medium">{template.name}</div>
                  <div className="text-xs text-muted-foreground">{template.title}</div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};