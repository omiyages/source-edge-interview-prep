
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import QuestionCard from "@/components/QuestionCard";
import { InterviewQuestion } from "@/services/questionsService";

interface QuestionsSectionProps {
  questions: InterviewQuestion[];
  loading: boolean;
  error: string | null;
}

const categories = ["All", "Technical", "Behavioral", "System Design", "Background", "Culture Fit", "Other"];
const difficulties = ["All", "Easy", "Medium", "Hard"];
const interviewStages = ["All", "Phone Screen", "Technical", "Onsite", "Final", "Other"];

export const QuestionsSection = ({ questions, loading, error }: QuestionsSectionProps) => {
  const [filteredQuestions, setFilteredQuestions] = useState<InterviewQuestion[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [interviewStageFilter, setInterviewStageFilter] = useState("All");

  useEffect(() => {
    let filtered = questions;

    if (searchTerm) {
      filtered = filtered.filter(q =>
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "All") {
      filtered = filtered.filter(q => q.category === categoryFilter);
    }

    if (difficultyFilter !== "All") {
      filtered = filtered.filter(q => q.difficulty === difficultyFilter);
    }

    if (interviewStageFilter !== "All") {
      filtered = filtered.filter(q => q.interview_stage === interviewStageFilter);
    }

    setFilteredQuestions(filtered);
  }, [questions, searchTerm, categoryFilter, difficultyFilter, interviewStageFilter]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Interview Questions</h2>
        <Input
          type="text"
          placeholder="Search questions..."
          className="max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Difficulty" />
          </SelectTrigger>
          <SelectContent>
            {difficulties.map(difficulty => (
              <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={interviewStageFilter} onValueChange={setInterviewStageFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Interview Stage" />
          </SelectTrigger>
          <SelectContent>
            {interviewStages.map(stage => (
              <SelectItem key={stage} value={stage}>{stage}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questions...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuestions.map(question => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </div>
      )}

      {!loading && filteredQuestions.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-gray-600">No questions found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};
