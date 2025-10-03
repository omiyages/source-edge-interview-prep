
import { Label } from "@/components/ui/label";

interface QuestionManagerHeaderProps {
  selectedCount: number;
}

export const QuestionManagerHeader = ({ selectedCount }: QuestionManagerHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <Label className="text-lg font-semibold">Manage Stage Questions</Label>
      <div className="text-sm text-gray-600">
        {selectedCount} questions selected
      </div>
    </div>
  );
};
