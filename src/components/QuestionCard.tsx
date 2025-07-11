
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
      case 'Backend Engineer': return 'bg-blue-100 text-blue-800';
      case 'Frontend Engineer': return 'bg-green-100 text-green-800';
      case 'SRE/DevOps': return 'bg-orange-100 text-orange-800';
      case 'Engineering Manager': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="card-interactive h-full flex flex-col animate-fade-in shadow-token-sm hover:shadow-token-lg">
      <CardHeader className="pb-token-md">
        <div className="flex items-start justify-between gap-token-sm mb-token-sm">
          <div className="flex flex-wrap gap-token-xs">
            <Badge 
              variant="secondary" 
              className="bg-primary/10 text-primary border-primary/20 hover-scale"
            >
              {question.role}
            </Badge>
            {question.status && (
              <Badge variant="outline" className="hover-scale">
                {question.status}
              </Badge>
            )}
          </div>
          {isAdmin && (
            <div className="flex gap-token-xs">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="btn-touch hover-scale text-primary hover:bg-primary/10"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Interview Question</DialogTitle>
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
                className="btn-touch hover-scale text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        <CardTitle className="text-token-lg leading-tight font-semibold text-card-foreground">
          {question.question}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col space-y-token-md">
        <div className="space-y-token-sm flex-1">
          <div className="text-token-sm text-muted-foreground">
            <span className="font-medium text-foreground">Company:</span> {question.company}
          </div>
          <div className="text-token-sm text-muted-foreground">
            <span className="font-medium text-foreground">Category:</span> {question.category}
          </div>
          <div className="text-token-sm text-muted-foreground">
            <span className="font-medium text-foreground">Interview Stage:</span> {question.interview_stage}
          </div>
          {question.additional_context && (
            <div className="p-token-md bg-muted/50 rounded-md text-token-sm border border-border/50">
              <span className="font-medium text-foreground block mb-token-xs">Additional Context:</span>
              <div 
                className="text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: question.additional_context.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                }}
              />
            </div>
          )}
        </div>
        <div className="text-token-xs text-muted-foreground mt-token-lg pt-token-md border-t border-border/50">
          Added {new Date(question.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
