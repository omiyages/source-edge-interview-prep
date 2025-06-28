
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import { QuestionFilters } from "./QuestionFilters";
import { QuestionList } from "./QuestionList";

interface ManageStageQuestionsFormProps {
  stageId: string;
  onSuccess: () => void;
}

interface InterviewQuestion {
  id: string;
  question: string;
  company: string;
  role: string;
  difficulty: string;
  category: string;
  interview_stage: string;
}

export const ManageStageQuestionsForm = ({ stageId, onSuccess }: ManageStageQuestionsFormProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [filters, setFilters] = useState({
    company: "",
    role: "",
    category: "",
    interview_stage: ""
  });

  // Fetch all questions (not just approved ones for admin flexibility)
  const { data: allQuestions, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['all-questions-for-stage'],
    queryFn: async () => {
      console.log('Fetching all questions for stage management...');
      const { data, error } = await supabase
        .from('interview_questions')
        .select('id, question, company, role, difficulty, category, interview_stage')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching questions:', error);
        throw error;
      }
      console.log('Fetched questions:', data?.length);
      return data as InterviewQuestion[];
    },
  });

  // Fetch currently assigned questions for this stage
  const { data: currentQuestions, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ['current-stage-questions', stageId],
    queryFn: async () => {
      console.log('Fetching current stage questions for stage:', stageId);
      const { data, error } = await supabase
        .from('stage_questions')
        .select('question_id')
        .eq('stage_id', stageId);
      
      if (error) {
        console.error('Error fetching current stage questions:', error);
        throw error;
      }
      console.log('Current stage questions:', data);
      return new Set(data.map(item => item.question_id));
    },
  });

  useEffect(() => {
    if (currentQuestions) {
      setSelectedQuestions(currentQuestions);
    }
  }, [currentQuestions]);

  const getUniqueValues = (field: keyof InterviewQuestion) => {
    if (!allQuestions) return [];
    return [...new Set(allQuestions.map(q => q[field]))].filter(Boolean).sort();
  };

  const filteredQuestions = allQuestions?.filter(question => {
    const matchesSearch = question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCompany = !filters.company || question.company === filters.company;
    const matchesRole = !filters.role || question.role === filters.role;
    const matchesCategory = !filters.category || question.category === filters.category;
    const matchesStage = !filters.interview_stage || question.interview_stage === filters.interview_stage;
    
    return matchesSearch && matchesCompany && matchesRole && matchesCategory && matchesStage;
  });

  const toggleQuestion = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      company: "",
      role: "",
      category: "",
      interview_stage: ""
    });
    setSearchTerm("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('Starting to save stage questions...');
      console.log('Stage ID:', stageId);
      console.log('Selected questions:', Array.from(selectedQuestions));

      // First, remove all existing questions for this stage
      const { error: deleteError } = await supabase
        .from('stage_questions')
        .delete()
        .eq('stage_id', stageId);

      if (deleteError) {
        console.error('Error deleting existing stage questions:', deleteError);
        throw deleteError;
      }
      console.log('Successfully deleted existing stage questions');

      // Then, add the selected questions
      if (selectedQuestions.size > 0) {
        const questionsToInsert = Array.from(selectedQuestions).map(questionId => ({
          stage_id: stageId,
          question_id: questionId,
        }));

        console.log('Inserting new stage questions:', questionsToInsert);

        const { error: insertError } = await supabase
          .from('stage_questions')
          .insert(questionsToInsert);

        if (insertError) {
          console.error('Error inserting stage questions:', insertError);
          throw insertError;
        }
        console.log('Successfully inserted new stage questions');
      }

      toast({
        title: "Questions updated!",
        description: `Successfully assigned ${selectedQuestions.size} questions to this stage.`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error updating stage questions:', error);
      toast({
        title: "Error",
        description: "Failed to update questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingQuestions || isLoadingCurrent) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading questions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Label className="text-lg font-semibold">Manage Stage Questions</Label>
        <div className="text-sm text-gray-600">
          {selectedQuestions.size} questions selected
        </div>
      </div>

      <QuestionFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        getUniqueValues={getUniqueValues}
      />

      <div className="max-h-96 overflow-y-auto">
        <QuestionList
          questions={filteredQuestions || []}
          selectedQuestions={selectedQuestions}
          onToggleQuestion={toggleQuestion}
          loading={isLoadingQuestions}
        />
      </div>

      {filteredQuestions?.length === 0 && !isLoadingQuestions && (
        <div className="text-center py-8">
          <p className="text-gray-500">No questions found matching your filters.</p>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};
