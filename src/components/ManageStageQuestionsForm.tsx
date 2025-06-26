
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  // Fetch all approved questions
  const { data: allQuestions, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['all-questions'],
    queryFn: async () => {
      console.log('Fetching all approved questions...');
      const { data, error } = await supabase
        .from('interview_questions')
        .select('id, question, company, role, difficulty, category, interview_stage')
        .eq('status', 'approved')
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

  // Update selected questions when current questions data changes
  useEffect(() => {
    if (currentQuestions) {
      setSelectedQuestions(currentQuestions);
    }
  }, [currentQuestions]);

  // Get unique filter options
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

      {/* Filter Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="space-y-2">
          <Label>Company</Label>
          <Select value={filters.company} onValueChange={(value) => setFilters({...filters, company: value})}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="All Companies" />
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-lg z-50">
              <SelectItem value="">All Companies</SelectItem>
              {getUniqueValues('company').map((company) => (
                <SelectItem key={company} value={company}>{company}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={filters.role} onValueChange={(value) => setFilters({...filters, role: value})}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-lg z-50">
              <SelectItem value="">All Roles</SelectItem>
              {getUniqueValues('role').map((role) => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-lg z-50">
              <SelectItem value="">All Categories</SelectItem>
              {getUniqueValues('category').map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Interview Stage</Label>
          <Select value={filters.interview_stage} onValueChange={(value) => setFilters({...filters, interview_stage: value})}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-lg z-50">
              <SelectItem value="">All Stages</SelectItem>
              {getUniqueValues('interview_stage').map((stage) => (
                <SelectItem key={stage} value={stage}>{stage}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-4 flex justify-end">
          <Button variant="outline" onClick={clearFilters} size="sm">
            Clear Filters
          </Button>
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
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                    {question.interview_stage}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredQuestions?.length === 0 && (
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
