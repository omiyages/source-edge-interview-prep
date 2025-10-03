
import { QuestionList } from "./QuestionList";

interface InterviewQuestion {
  id: string;
  question: string;
  company: string;
  role: string;
  category: string;
  interview_stage: string;
}

interface QuestionManagerContentProps {
  questions: InterviewQuestion[] | undefined;
  selectedQuestions: Set<string>;
  onToggleQuestion: (questionId: string) => void;
  isLoading: boolean;
}

export const QuestionManagerContent = ({
  questions,
  selectedQuestions,
  onToggleQuestion,
  isLoading
}: QuestionManagerContentProps) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading questions...</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-h-96 overflow-y-auto">
        <QuestionList
          questions={questions || []}
          selectedQuestions={selectedQuestions}
          onToggleQuestion={onToggleQuestion}
          loading={isLoading}
        />
      </div>

      {questions?.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No questions found matching your filters.</p>
        </div>
      )}
    </>
  );
};
