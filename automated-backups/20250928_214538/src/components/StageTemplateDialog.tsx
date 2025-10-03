// ABOUTME: Dialog component for saving a stage as a template with a custom name
// ABOUTME: Allows users to provide a template name and save current stage configuration

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { CourseStage, useStageTemplates } from "@/hooks/useStageTemplates";

interface StageTemplateDialogProps {
  stage: CourseStage;
  children: React.ReactNode;
}

export const StageTemplateDialog = ({ stage, children }: StageTemplateDialogProps) => {
  const [open, setOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const { saveTemplate, isSaving } = useStageTemplates();

  const handleSave = async () => {
    if (!templateName.trim()) return;

    saveTemplate(
      { name: templateName.trim(), stage },
      {
        onSuccess: () => {
          setOpen(false);
          setTemplateName("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Stage as Template</DialogTitle>
          <DialogDescription>
            Give this template a name so you can reuse this stage configuration later.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              placeholder="e.g., Technical Interview (Coding)"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isSaving) {
                  handleSave();
                }
              }}
            />
          </div>
          
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium">Stage Preview:</p>
            <p className="text-sm text-muted-foreground mt-1">
              <strong>Title:</strong> {stage.title || "Untitled Stage"}
            </p>
            {stage.description && (
              <p className="text-sm text-muted-foreground">
                <strong>Description:</strong> {stage.description}
              </p>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!templateName.trim() || isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};