
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface InterviewQuestion {
  id: string;
  question: string;
  company: string;
  role: string;
  interview_stage: string;
  category: string;
  submitted_by: string | null;
  additional_context: string | null;
  created_at: string;
  question_type: string;
  source_url: string | null;
  source_website: string | null;
  scraped_at: string | null;
  status?: string;
}

interface QuestionCardProps {
  question: InterviewQuestion;
}

const QuestionCard = ({ question }: QuestionCardProps) => {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log('🗑️ QuestionCard delete check:', {
    questionId: question.id,
    userEmail: user?.email,
    isAdmin,
    canDelete: isAdmin
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      console.log('🗑️ Attempting to delete question:', questionId);
      
      const { error } = await supabase
        .from('interview_questions')
        .delete()
        .eq('id', questionId);
      
      if (error) {
        console.error('❌ Delete error:', error);
        throw error;
      }
      
      console.log('✅ Question deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-questions'] });
      toast({
        title: "Question Deleted",
        description: "The question has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      console.error('❌ Delete mutation error:', error);
      toast({
        title: "Error",
        description: `Failed to delete question: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  const getRoleTypeColor = (roleType: string) => {
    switch (roleType) {
      case 'Backend Engineer': return 'bg-blue-100 text-blue-800';
      case 'Frontend Engineer': return 'bg-green-100 text-green-800';
      case 'SRE/DevOps': return 'bg-orange-100 text-orange-800';
      case 'Engineering Manager': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap gap-1">
            <Badge className={getRoleTypeColor(question.role)}>
              {question.role}
            </Badge>
            {question.status && (
              <Badge variant="outline">
                {question.status}
              </Badge>
            )}
          </div>
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log('🗑️ Delete button clicked for question:', question.id);
                deleteQuestionMutation.mutate(question.id);
              }}
              disabled={deleteQuestionMutation.isPending}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
        <CardTitle className="text-lg leading-tight">
          {question.question}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          <div className="text-sm text-gray-600">
            <strong>Company:</strong> {question.company}
          </div>
          <div className="text-sm text-gray-600">
            <strong>Category:</strong> {question.category}
          </div>
          <div className="text-sm text-gray-600">
            <strong>Interview Stage:</strong> {question.interview_stage}
          </div>
          {question.additional_context && (
            <div className="p-3 bg-gray-50 rounded-md text-sm">
              <strong>Additional Context:</strong>
              <p className="mt-1">{question.additional_context}</p>
            </div>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-4 pt-3 border-t">
          Added {new Date(question.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
