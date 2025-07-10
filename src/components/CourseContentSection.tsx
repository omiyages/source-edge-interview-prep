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
}

export const CourseContentSection = ({
  selectedStage,
  stageQuestions,
  isAdmin,
  onManageResourcesClick,
  onManageQuestionsClick,
}: CourseContentSectionProps) => {
  if (!selectedStage) return null;

  return (
    <div className="space-y-8">
      <StageInformation selectedStage={selectedStage} />

      <StageResourcesSection
        stageId={selectedStage.id}
        isAdmin={isAdmin}
        onManageClick={onManageResourcesClick}
      />

      <StageQuestions
        questions={stageQuestions}
        isAdmin={isAdmin}
        onManageClick={onManageQuestionsClick}
      />
    </div>
  );
};