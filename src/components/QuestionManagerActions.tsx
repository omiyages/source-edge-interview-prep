
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
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
      >
        <Save className="w-4 h-4 mr-2" />
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
};
