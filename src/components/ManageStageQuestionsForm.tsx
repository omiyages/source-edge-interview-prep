
import { QuestionManager } from "./QuestionManager";
import { useQueryClient } from "@tanstack/react-query";

interface ManageStageQuestionsFormProps {
  stageId: string;
  onSuccess: () => void;
}

export const ManageStageQuestionsForm = ({ stageId, onSuccess }: ManageStageQuestionsFormProps) => {
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    // Invalidate the stage questions query to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['stage-questions', stageId] });
    onSuccess();
  };

  return <QuestionManager stageId={stageId} onSuccess={handleSuccess} />;
};
