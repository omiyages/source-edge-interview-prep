
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Save } from "lucide-react";

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
}

export const ManageStageQuestionsForm = ({ stageId, onSuccess }: ManageStageQuestionsFormProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all approved questions
  const { data: allQuestions, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['all-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interview_questions')
        .select('id, question, company, role, difficulty, category')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching questions:', error);
        throw error;
      }
      return data as InterviewQuestion[];
    },
  });

  // Fetch currently assigned questions for this stage
  const { data: currentQuestions, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ['current-stage-questions', stageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stage_questions')
        .select('question_id')
        .eq('stage_id', stageId);
      
      if (error) {
        console.error('Error fetching current stage questions:', error);
        throw error;
      }
      return new Set(data.map(item => item.question_id));
    },
  });

  // Update selected questions when current questions data changes
  useEffect(() => {
    if (currentQuestions) {
      setSelectedQuestions(currentQuestions);
    }
  }, [currentQuestions]);

  const filteredQuestions = allQuestions?.filter(question => 
    question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleQuestion = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // First, remove all existing questions for this stage
      const { error: deleteError } = await supabase
        .from('stage_questions')
        .delete()
        .eq('stage_id', stageId);

      if (deleteError) {
        console.error('Error deleting existing stage questions:', deleteError);
        throw deleteError;
      }

      // Then, add the selected questions
      if (selectedQuestions.size > 0) {
        const questionsToInsert = Array.from(selectedQuestions).map(questionId => ({
          stage_id: stageId,
          question_id: questionId,
        }));

        const { error: insertError } = await supabase
          .from('stage_questions')
          .insert(questionsToInsert);

        if (insertError) {
          console.error('Error inserting stage questions:', insertError);
          throw insertError;
        }
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
        <div className="flex-1 max-w-md">
          <Label htmlFor="search">Search Questions</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Search by question, company, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="text-sm text-gray-600">
          {selectedQuestions.size} questions selected
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-2">
        {filteredQuestions?.map((question) => (
          <Card key={question.id} className="p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={selectedQuestions.has(question.id)}
                onCheckedChange={() => toggleQuestion(question.id)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                  {question.question}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {question.company}
                  </span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                    {question.role}
                  </span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    {question.category}
                  </span>
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                    {question.difficulty}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredQuestions?.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No questions found matching your search.</p>
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
