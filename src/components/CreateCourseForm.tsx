
import { CreateCourseWorkflow } from "./CreateCourseWorkflow";

interface CreateCourseFormProps {
  onSuccess: () => void;
}

export const CreateCourseForm = ({ onSuccess }: CreateCourseFormProps) => {
  return (
    <div className="w-full">
      <CreateCourseWorkflow onSuccess={onSuccess} />
    </div>
  );
};
