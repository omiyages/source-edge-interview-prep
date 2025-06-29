
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
    <div className="mb-8">
      <div className="flex flex-wrap gap-2">
        {stages.map((stage, index) => (
          <Button
            key={stage.id}
            variant={selectedStage?.id === stage.id ? "default" : "outline"}
            onClick={() => onStageSelect(stage)}
            className="flex items-center gap-2"
          >
            <Badge variant="secondary" className="text-xs">
              {index + 1}
            </Badge>
            {stage.title}
          </Button>
        ))}
      </div>
    </div>
  );
};
