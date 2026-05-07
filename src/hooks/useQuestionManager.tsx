
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useClerkSupabase } from "@/hooks/useClerkSupabase";
import { useAuth } from "@/hooks/useAuth";

interface InterviewQuestion {
  id: string;
  question: string;
  company: string;
  role: string;
  category: string;
  interview_stage: string;
  additional_context: string | null;
  team: string | null;
  position_name: string | null;
  source_website: string | null;
}

export const useQuestionManager = (stageId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, hasClerkJwt, clerkClientReady, refreshClerkToken } = useAuth();
  const { client: supabase } = useClerkSupabase();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [filters, setFilters] = useState({
    company: "",
    role: "",
    category: "",
    interview_stage: ""
  });

  // Verify stage exists before proceeding
  const { data: stageExists } = useQuery({
    queryKey: ['stage-exists', stageId],
    queryFn: async () => {
      if (!user?.id) return false;
      if (!clerkClientReady || !hasClerkJwt) {
        await refreshClerkToken?.();
      }
      const { data, error } = await supabase
        .from('course_stages')
        .select('id')
        .eq('id', stageId)
        .single();
      
      if (error) {
        return false;
      }
      return !!data;
    },
    enabled: Boolean(stageId && user?.id),
  });

  // Fetch all questions
  const { data: allQuestions, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['all-questions-for-stage'],
    queryFn: async () => {
      if (!clerkClientReady || !hasClerkJwt) {
        await refreshClerkToken?.();
      }
      const { data, error } = await supabase
        .from('interview_questions')
        .select('id, question, company, role, category, interview_stage, additional_context, team, position_name, source_website')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      return data as InterviewQuestion[];
    },
    enabled: Boolean(user?.id && clerkClientReady && hasClerkJwt),
  });

  // Fetch currently assigned questions
  const { data: currentQuestions, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ['current-stage-questions', stageId],
    queryFn: async () => {
      if (!clerkClientReady || !hasClerkJwt) {
        await refreshClerkToken?.();
      }
      const { data, error } = await supabase
        .from('stage_questions')
        .select('question_id')
        .eq('stage_id', stageId);
      
      if (error) {
        throw error;
      }
      return new Set(data.map(item => item.question_id));
    },
    enabled: Boolean(stageExists && user?.id && clerkClientReady && hasClerkJwt), // Only fetch if stage exists
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
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      question.question.toLowerCase().includes(searchLower) ||
      question.company.toLowerCase().includes(searchLower) ||
      question.role.toLowerCase().includes(searchLower) ||
      question.category?.toLowerCase().includes(searchLower) ||
      question.interview_stage?.toLowerCase().includes(searchLower) ||
      question.additional_context?.toLowerCase().includes(searchLower) ||
      question.team?.toLowerCase().includes(searchLower) ||
      question.position_name?.toLowerCase().includes(searchLower) ||
      question.source_website?.toLowerCase().includes(searchLower);
    
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

  const handleSave = async (onSuccess: () => void) => {
    if (!stageExists) {
      toast({
        title: "Error",
        description: "Invalid stage. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (!user?.id) {
        throw new Error("You must be signed in to assign questions.");
      }
      if (!clerkClientReady || !hasClerkJwt) {
        await refreshClerkToken?.();
      }

      // First, remove all existing questions for this stage
      const { error: deleteError } = await supabase
        .from('stage_questions')
        .delete()
        .eq('stage_id', stageId);

      if (deleteError) {
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
          throw insertError;
        }
      }

      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['stage-questions', stageId] });
      queryClient.invalidateQueries({ queryKey: ['current-stage-questions', stageId] });

      toast({
        title: "Questions updated!",
        description: `Successfully assigned ${selectedQuestions.size} questions to this stage.`,
      });

      onSuccess();
    } catch (error) {
      
      // Provide more specific error messages
      let errorMessage = "Failed to update questions. Please try again.";
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === '23503') {
          errorMessage = "Invalid stage or question reference. Please refresh the page and try again.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedQuestions,
    isSaving,
    filters,
    allQuestions,
    filteredQuestions,
    isLoadingQuestions,
    isLoadingCurrent: isLoadingCurrent || !stageExists,
    toggleQuestion,
    handleFilterChange,
    clearFilters,
    handleSave,
    getUniqueValues
  };
};
