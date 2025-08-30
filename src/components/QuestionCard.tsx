// ABOUTME: Component for displaying individual interview question cards
// ABOUTME: Supports hiding delete button for course pages to avoid confusion

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, ExternalLink, Building, User, Calendar, Hash } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { checkQuestionDeletePermission, checkQuestionEditPermission } from "@/utils/questionPermissions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EditQuestionForm } from "@/components/EditQuestionForm";

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
  onQuestionUpdate?: () => void;
  hideDelete?: boolean;
}

const QuestionCard = ({ question, onQuestionUpdate, hideDelete = false }: QuestionCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  // Check permissions on component mount
  useState(() => {
    if (user?.email) {
      checkQuestionDeletePermission(question.id, user.email, isAdmin).then(setCanDelete);
      checkQuestionEditPermission(question.id, user.email, isAdmin).then(setCanEdit);
    }
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      console.log('🗑️ Deleting question:', question.id);

      const { error } = await supabase
        .from('interview_questions')
        .delete()
        .eq('id', question.id);

      if (error) {
        console.error('❌ Delete error:', error);
        throw error;
      }

      console.log('✅ Question deleted successfully');
      
      toast({
        title: "Question deleted",
        description: "The question has been successfully deleted.",
      });

      onQuestionUpdate?.();
    } catch (error) {
      console.error('💥 Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    onQuestionUpdate?.();
    toast({
      title: "Question updated",
      description: "The question has been successfully updated.",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-200 border-gray-200 bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1">
            {question.question}
          </CardTitle>
          <div className="flex gap-1 flex-shrink-0">
            {canEdit && (
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit Question</DialogTitle>
                  </DialogHeader>
                  <EditQuestionForm
                    question={question}
                    onSuccess={handleEditSuccess}
                    onCancel={() => setIsEditDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
            {canDelete && !hideDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
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
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3">
        {/* Company and Role */}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Building className="w-3 h-3" />
            <span className="font-medium">{question.company}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <User className="w-3 h-3" />
            <span>{question.role}</span>
          </div>
        </div>

        {/* Category and Stage badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100">
            <Hash className="w-2 h-2 mr-1" />
            {question.category}
          </Badge>
          <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
            {question.interview_stage}
          </Badge>
        </div>

        {/* Additional context */}
        {question.additional_context && (
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border-l-2 border-gray-300">
            <p className="font-medium text-gray-700 mb-1">Context:</p>
            <p>{truncateText(question.additional_context, 150)}</p>
          </div>
        )}

        {/* Source link */}
        {question.source_url && (
          <div className="mt-auto">
            <a
              href={question.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Source: {question.source_website || 'External Link'}
            </a>
          </div>
        )}

        {/* Footer with metadata */}
        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(question.created_at)}</span>
          </div>
          {question.question_type === 'user_submitted' && question.submitted_by && (
            <span className="text-green-600 font-medium">Community</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
