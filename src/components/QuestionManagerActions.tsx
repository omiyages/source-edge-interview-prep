
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface QuestionManagerActionsProps {
  onSave: () => void;
  isSaving: boolean;
}

export const QuestionManagerActions = ({ onSave, isSaving }: QuestionManagerActionsProps) => {
  return (
    <div className="flex justify-end pt-4 border-t">
      <Button 
        onClick={onSave} 
        disabled={isSaving}
        variant="gradient"
      >
        <Save className="w-4 h-4 mr-2" />
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
};
