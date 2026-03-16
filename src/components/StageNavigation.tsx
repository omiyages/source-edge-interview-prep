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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stages.map((stage, index) => {
          const isSelected = selectedStage?.id === stage.id;
          return (
            <button
              key={stage.id}
              onClick={() => onStageSelect(stage)}
              className={`flex items-center gap-3 px-4 py-4 rounded-xl transition-all border ${
                isSelected 
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                  : "bg-neutral-900 text-neutral-400 border-neutral-700 hover:border-neutral-600 hover:shadow-sm"
              }`}
            >
              <span 
                className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold flex-shrink-0 ${
                  isSelected 
                    ? "bg-white/20 text-white" 
                    : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {index + 1}
              </span>
              <span className={`text-sm font-medium text-left leading-tight ${
                isSelected ? "text-white" : "text-neutral-300"
              }`}>
                {stage.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
