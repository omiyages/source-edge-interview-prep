import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Edit } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EditQuestionForm } from "./EditQuestionForm";
import { sanitizeHtml } from "@/utils/htmlSanitizer";

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
  team: string | null;
  position_name: string | null;
}

interface QuestionCardProps {
  question: InterviewQuestion;
}

const QuestionCard = ({ question }: QuestionCardProps) => {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
      case 'Backend Engineer': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Frontend Engineer': return 'bg-green-50 text-green-700 border-green-200';
      case 'SRE/DevOps': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Engineering Manager': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Securely sanitize additional context
  const formattedContext = question.additional_context 
    ? sanitizeHtml(question.additional_context)
    : null;

  return (
    <Card className="group h-full flex flex-col bg-white hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-gray-300">
      <CardHeader className="pb-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge 
              variant="secondary" 
              className={`text-xs font-medium px-2 py-1 ${getRoleTypeColor(question.role)}`}
            >
              {question.role}
            </Badge>
            {question.status && (
              <Badge variant="outline" className="text-xs font-medium px-2 py-1">
                {question.status}
              </Badge>
            )}
          </div>
          {isAdmin && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-600 hover:text-primary hover:bg-primary/10"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">Edit Interview Question</DialogTitle>
                  </DialogHeader>
                  <EditQuestionForm 
                    question={question} 
                    onSuccess={() => setIsEditDialogOpen(false)} 
                  />
                </DialogContent>
              </Dialog>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('🗑️ Delete button clicked for question:', question.id);
                  deleteQuestionMutation.mutate(question.id);
                }}
                disabled={deleteQuestionMutation.isPending}
                className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        <CardTitle className="text-sm font-medium leading-relaxed text-gray-900 line-clamp-3">
          {question.question}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col space-y-3">
        <div className="space-y-2 flex-1">
          <div className="text-xs text-gray-600">
            <span className="font-medium text-gray-900">Company:</span> {question.company}
          </div>
          <div className="text-xs text-gray-600">
            <span className="font-medium text-gray-900">Category:</span> {question.category}
          </div>
          <div className="text-xs text-gray-600">
            <span className="font-medium text-gray-900">Stage:</span> {question.interview_stage}
          </div>
          {formattedContext && (
            <div className="p-3 bg-gray-50 rounded-md text-xs border border-gray-100">
              <span className="font-medium text-gray-900 block mb-1">Additional Context:</span>
              <div 
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formattedContext }}
              />
            </div>
          )}
        </div>
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
          Added {new Date(question.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
