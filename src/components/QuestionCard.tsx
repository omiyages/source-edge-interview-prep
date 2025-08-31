// ABOUTME: This component displays individual interview question cards with view/edit/delete functionality
// ABOUTME: It handles question display, admin actions, and detailed question viewing in modal dialogs

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Edit, Star, Eye, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EditQuestionForm } from "./EditQuestionForm";
import { RichTextDisplay } from "@/components/ui/rich-text-display";

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
  recommended?: boolean;
}

interface QuestionCardProps {
  question: InterviewQuestion;
  showDeleteButton?: boolean;
  // Course-specific props for removal instead of deletion
  stageId?: string;
  onRemoveFromStage?: (questionId: string) => void;
}

const QuestionCard = ({ 
  question, 
  showDeleteButton = true, 
  stageId, 
  onRemoveFromStage 
}: QuestionCardProps) => {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  console.log('🗑️ QuestionCard delete check:', {
    questionId: question.id,
    userEmail: user?.email,
    isAdmin,
    canDelete: isAdmin,
    stageId,
    hasRemoveHandler: !!onRemoveFromStage
  });

  // Course-specific removal mutation
  const removeFromStageMutation = useMutation({
    mutationFn: async (questionId: string) => {
      if (!stageId) throw new Error('Stage ID required for removal');
      
      console.log('🗑️ Attempting to remove question from stage:', { questionId, stageId });
      
      const { error } = await supabase
        .from('stage_questions')
        .delete()
        .eq('stage_id', stageId)
        .eq('question_id', questionId);
      
      if (error) {
        console.error('❌ Remove from stage error:', error);
        throw error;
      }
      
      console.log('✅ Question removed from stage successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stage-questions', stageId] });
      toast({
        title: "Question Removed",
        description: "The question has been removed from this course stage.",
      });
      
      // Call the parent's remove handler if provided
      if (onRemoveFromStage) {
        onRemoveFromStage(question.id);
      }
    },
    onError: (error: any) => {
      console.error('❌ Remove from stage mutation error:', error);
      toast({
        title: "Error",
        description: `Failed to remove question: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  // Full question deletion mutation (for non-course contexts)
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

  const handleDeleteClick = () => {
    if (stageId && onRemoveFromStage) {
      // Course context: remove from stage
      console.log('🗑️ Removing question from stage:', question.id);
      removeFromStageMutation.mutate(question.id);
    } else {
      // Non-course context: delete question entirely
      console.log('🗑️ Deleting question entirely:', question.id);
      deleteQuestionMutation.mutate(question.id);
    }
  };

  const getRoleTypeColor = (roleType: string) => {
    switch (roleType) {
      case 'Backend Engineer': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Frontend Engineer': return 'bg-green-50 text-green-700 border-green-200';
      case 'SRE/DevOps': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Engineering Manager': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Determine which icon and tooltip to show
  const deleteIcon = stageId && onRemoveFromStage ? X : Trash2;
  const deleteTooltip = stageId && onRemoveFromStage 
    ? "Remove from course" 
    : "Delete question permanently";

  return (
    <>
      <Card className="group h-full flex flex-col bg-white hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-gray-300">
        <CardHeader className="pb-3 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-1.5 items-center">
              {question.recommended && (
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              )}
              <Badge 
                variant="secondary" 
                className={`text-xs font-medium px-2 py-1 ${getRoleTypeColor(question.role)}`}
              >
                {question.role}
              </Badge>
            </div>
            {isAdmin && showDeleteButton && (
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
                  onClick={handleDeleteClick}
                  disabled={deleteQuestionMutation.isPending || removeFromStageMutation.isPending}
                  className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50"
                  title={deleteTooltip}
                >
                  {React.createElement(deleteIcon, { className: "w-4 h-4" })}
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
          </div>
          
          {/* View Question Button */}
          <div className="pt-2">
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs border-gray-300 hover:bg-gray-50"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View Question
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">Question Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {question.recommended && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                    <Badge 
                      variant="secondary" 
                      className={`text-xs font-medium px-2 py-1 ${getRoleTypeColor(question.role)}`}
                    >
                      {question.role}
                    </Badge>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Question</h3>
                    <p className="text-sm text-gray-700 break-words">{question.question}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-900">Company:</span>
                      <p className="text-sm text-gray-600 break-words">{question.company}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Category:</span>
                      <p className="text-sm text-gray-600 break-words">{question.category}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Stage:</span>
                      <p className="text-sm text-gray-600 break-words">{question.interview_stage}</p>
                    </div>
                  </div>
                  
                  {question.additional_context && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Additional Context</h3>
                      <div className="p-3 bg-gray-50 rounded-md border border-gray-100 overflow-hidden">
                        <RichTextDisplay 
                          content={question.additional_context} 
                          className="text-sm break-words overflow-wrap-anywhere max-w-full [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_pre]:break-words [&_pre]:whitespace-pre-wrap [&_code]:break-words [&_code]:whitespace-pre-wrap" 
                        />
                      </div>
                    </div>
                  )}
                  
                  {(question.team || question.position_name) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {question.team && (
                        <div>
                          <span className="font-medium text-gray-900">Team:</span>
                          <p className="text-sm text-gray-600 break-words">{question.team}</p>
                        </div>
                      )}
                      {question.position_name && (
                        <div>
                          <span className="font-medium text-gray-900">Position:</span>
                          <p className="text-sm text-gray-600 break-words">{question.position_name}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {(question.source_url || question.source_website) && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Source Information</h3>
                      <div className="space-y-1">
                        {question.source_website && (
                          <div>
                            <span className="font-medium text-gray-900">Website:</span>
                            <p className="text-sm text-gray-600 break-words">{question.source_website}</p>
                          </div>
                        )}
                        {question.source_url && (
                          <div>
                            <span className="font-medium text-gray-900">URL:</span>
                            <a 
                              href={question.source_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline break-all block"
                            >
                              {question.source_url}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
            Added {new Date(question.created_at).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default QuestionCard;
