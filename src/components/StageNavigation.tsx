
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
      {/* Mobile: 2-column grid */}
      <div className="md:hidden grid grid-cols-2 gap-2">
        {stages.map((stage, index) => (
          <Button
            key={stage.id}
            variant={selectedStage?.id === stage.id ? "default" : "outline"}
            onClick={() => onStageSelect(stage)}
            className={`flex items-center gap-2 text-sm ${
              selectedStage?.id === stage.id 
                ? "bg-purple-gradient hover:shadow-lg hover:shadow-purple-500/25 text-white border-none" 
                : ""
            }`}
          >
            <Badge 
              variant="secondary" 
              className={`text-xs ${
                selectedStage?.id === stage.id 
                  ? "bg-white/20 text-white border-white/30" 
                  : "bg-purple-gradient text-white"
              }`}
            >
              {index + 1}
            </Badge>
            <span className="truncate">{stage.title}</span>
          </Button>
        ))}
      </div>

      {/* Desktop: horizontal flex layout */}
      <div className="hidden md:flex flex-wrap gap-2">
        {stages.map((stage, index) => (
          <Button
            key={stage.id}
            variant={selectedStage?.id === stage.id ? "default" : "outline"}
            onClick={() => onStageSelect(stage)}
            className={`flex items-center gap-2 ${
              selectedStage?.id === stage.id 
                ? "bg-purple-gradient hover:shadow-lg hover:shadow-purple-500/25 text-white border-none" 
                : ""
            }`}
          >
            <Badge 
              variant="secondary" 
              className={`text-xs ${
                selectedStage?.id === stage.id 
                  ? "bg-white/20 text-white border-white/30" 
                  : "bg-purple-gradient text-white"
              }`}
            >
              {index + 1}
            </Badge>
            {stage.title}
          </Button>
        ))}
      </div>
    </div>
  );
};
