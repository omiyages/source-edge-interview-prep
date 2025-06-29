
import { QuestionManager } from "./QuestionManager";

interface ManageStageQuestionsFormProps {
  stageId: string;
  onSuccess: () => void;
}

export const ManageStageQuestionsForm = ({ stageId, onSuccess }: ManageStageQuestionsFormProps) => {
  return <QuestionManager stageId={stageId} onSuccess={onSuccess} />;
};
