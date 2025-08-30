// ABOUTME: Card component for displaying individual interview questions with edit/delete actions
// ABOUTME: Supports conditional display of delete button based on context

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
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
  team: string | null;
  position_name: string | null;
}

interface QuestionCardProps {
  question: InterviewQuestion;
  showDeleteButton?: boolean;
}

const QuestionCard = ({ question, showDeleteButton = true }: QuestionCardProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('interview_questions')
        .delete()
        .eq('id', question.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast({
        title: "Question deleted",
        description: "The question has been successfully deleted.",
      });
    },
    onError: (error) => {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditSuccess = () => {
    setShowEditDialog(false);
    queryClient.invalidateQueries({ queryKey: ['questions'] });
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-relaxed line-clamp-3 flex-1">
                {question.question}
              </p>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowViewDialog(true)}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                {isAdmin && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowEditDialog(true)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {showDeleteButton && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Question</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this question? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate()}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-xs">
                {question.company}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {question.role}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {question.category}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Question Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Question Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Question</h4>
              <p className="text-sm text-gray-700">{question.question}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-1">Company</h4>
                <p className="text-sm text-gray-600">{question.company}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Role</h4>
                <p className="text-sm text-gray-600">{question.role}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Category</h4>
                <p className="text-sm text-gray-600">{question.category}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Interview Stage</h4>
                <p className="text-sm text-gray-600">{question.interview_stage}</p>
              </div>
            </div>

            {question.additional_context && (
              <div>
                <h4 className="font-medium mb-2">Additional Context</h4>
                <p className="text-sm text-gray-700">{question.additional_context}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
          </DialogHeader>
          <EditQuestionForm
            question={question}
            onSuccess={handleEditSuccess}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuestionCard;
