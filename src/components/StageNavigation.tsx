
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CourseStage {
  id: string;
  title: string;
  description: string | null;
  information: string | null;
  stage_order: number;
}

interface StageNavigationProps {
  stages: CourseStage[];
  selectedStage: CourseStage | null;
  onStageSelect: (stage: CourseStage) => void;
}

export const StageNavigation = ({ stages, selectedStage, onStageSelect }: StageNavigationProps) => {
  if (!stages || stages.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 overflow-x-auto">
        {stages.map((stage, index) => {
          const isSelected = selectedStage?.id === stage.id;
          return (
            <button
              key={stage.id}
              onClick={() => onStageSelect(stage)}
              className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg transition-all flex-1 ${
                isSelected 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Badge 
                className={`text-xs font-bold min-w-[24px] h-6 flex items-center justify-center rounded-full ${
                  isSelected 
                    ? "bg-white/20 text-white" 
                    : "bg-primary text-white"
                }`}
              >
                {index + 1}
              </Badge>
              <span className="text-sm font-medium text-center">{stage.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
