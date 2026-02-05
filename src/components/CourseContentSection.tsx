
import { StageInformation } from "@/components/StageInformation";
import { StageResourcesSection } from "@/components/StageResourcesSection";
import { StageQuestions } from "@/components/StageQuestions";

interface CourseStage {
  id: string;
  title: string;
  description: string | null;
  information: string | null;
  stage_order: number;
}

interface InterviewQuestion {
  id: string;
  question: string;
  company: string;
  role: string;
  interview_stage: string;
  category: string;
  submitted_by: string | null;
  additional_context: string | null;
  created_at: string;
  question_type: string;
  source_url: string | null;
  source_website: string | null;
  scraped_at: string | null;
  team: string | null;
  position_name: string | null;
}

interface CourseContentSectionProps {
  selectedStage: CourseStage | null;
  stageQuestions?: InterviewQuestion[];
  isAdmin: boolean;
  onManageResourcesClick: () => void;
  onManageQuestionsClick: () => void;
  onQuestionsUpdate?: () => void;
  stageCompleteButton?: React.ReactNode;
}

export const CourseContentSection = ({
  selectedStage,
  stageQuestions,
  isAdmin,
  onManageResourcesClick,
  onManageQuestionsClick,
  onQuestionsUpdate,
  stageCompleteButton,
}: CourseContentSectionProps) => {
  if (!selectedStage) return null;

  return (
    <div className="space-y-8">
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Stage Information (75%) */}
        <div className="lg:col-span-3">
          <StageInformation 
            information={selectedStage.information} 
            stageTitle={selectedStage.title}
            stageId={selectedStage.id}
            stageDescription={selectedStage.description}
          >
            {stageCompleteButton}
          </StageInformation>
        </div>

        {/* Right Column: Learning Resources (25%) */}
        <div className="lg:col-span-1">
      <StageResourcesSection
        stageId={selectedStage.id}
        isAdmin={isAdmin}
        onManageClick={onManageResourcesClick}
      />
        </div>
      </div>

      {/* Full Width: Practice Questions */}
      <div>
      <StageQuestions
        questions={stageQuestions}
        isAdmin={isAdmin}
        onManageClick={onManageQuestionsClick}
        stageId={selectedStage.id}
        onQuestionsUpdate={onQuestionsUpdate}
      />
      </div>
    </div>
  );
};
