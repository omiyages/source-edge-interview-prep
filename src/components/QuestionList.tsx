
import { Checkbox } from "@/components/ui/checkbox";

interface InterviewQuestion {
  id: string;
  question: string;
  company: string;
  role: string;
  category: string;
  interview_stage: string;
}

interface QuestionListProps {
  questions: InterviewQuestion[];
  selectedQuestions: Set<string>;
  onToggleQuestion: (questionId: string) => void;
  loading?: boolean;
}

export const QuestionList = ({
  questions,
  selectedQuestions,
  onToggleQuestion,
  loading = false
}: QuestionListProps) => {
  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Loading questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <p className="text-xs text-gray-500 text-center py-4">
        No questions found. Try adjusting your search or filters.
      </p>
    );
  }

  return (
    <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
      {questions.map((question) => (
        <div key={question.id} className="flex items-start gap-2 p-2 border rounded">
          <Checkbox
            checked={selectedQuestions.has(question.id)}
            onCheckedChange={() => onToggleQuestion(question.id)}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 line-clamp-1 mb-1">
              {question.question}
            </p>
            <div className="flex flex-wrap gap-1 text-xs">
              <span className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs">
                {question.company}
              </span>
              <span className="bg-green-100 text-green-800 px-1 py-0.5 rounded text-xs">
                {question.role}
              </span>
              <span className="bg-purple-100 text-purple-800 px-1 py-0.5 rounded text-xs">
                {question.category}
              </span>
              <span className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs">
                {question.interview_stage}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
