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
                  ? "bg-[#E4E4E4] text-neutral-950 border-[#E4E4E4] shadow-lg"
                  : "bg-neutral-900 text-neutral-400 border-neutral-700 hover:border-neutral-600 hover:shadow-sm"
              }`}
            >
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold flex-shrink-0 ${
                  isSelected
                    ? "bg-neutral-950/10 text-neutral-950"
                    : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {index + 1}
              </span>
              <span className={`text-sm font-medium text-left leading-tight ${
                isSelected ? "text-neutral-950" : "text-neutral-300"
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
