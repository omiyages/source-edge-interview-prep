// ABOUTME: This component displays individual interview question cards with view/edit/delete functionality
// ABOUTME: It handles question display, admin actions, and detailed question viewing in modal dialogs

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Edit, Star, X, ThumbsUp, Bookmark, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EditQuestionForm } from "./EditQuestionForm";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { useQuestionThumbsUp } from "@/hooks/useThumbsUp";
import { useQuestionBookmark } from "@/hooks/useQuestionBookmark";

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
  /** When provided, View Question uses the parent's dialog (e.g. QuestionDetailDialog) instead of the inline one */
  onViewQuestion?: () => void;
  // Course-specific props for removal instead of deletion
  stageId?: string;
  onRemoveFromStage?: (questionId: string) => void;
}

const QuestionCard = ({ 
  question, 
  showDeleteButton = true, 
  onViewQuestion,
  stageId, 
  onRemoveFromStage 
}: QuestionCardProps) => {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { count: thumbsUpCount, hasThumbsUp, toggleThumbsUp, isToggling } = useQuestionThumbsUp(question.id);
  const { isBookmarked, toggleBookmark, isToggling: isBookmarkToggling } = useQuestionBookmark(question.id);

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

  // Determine which icon and tooltip to show
  const deleteIcon = stageId && onRemoveFromStage ? X : Trash2;
  const deleteTooltip = stageId && onRemoveFromStage 
    ? "Remove from course" 
    : "Delete question permanently";

  return (
    <>
      <div className="group h-full flex flex-col bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 p-5">
        {/* Header: Role Badge + Bookmark */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {question.recommended && (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            )}
            <Badge className="bg-primary/10 text-primary border-0 text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 text-center">
              {question.role}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {isAdmin && showDeleteButton && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-primary hover:bg-primary/10"
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
                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                  title={deleteTooltip}
                >
                  {React.createElement(deleteIcon, { className: "w-4 h-4" })}
                </Button>
              </div>
            )}
            <button
              onClick={() => user && toggleBookmark()}
              disabled={isBookmarkToggling || !user}
              className={`p-1.5 rounded-md transition-colors ${
                isBookmarked 
                  ? "text-primary" 
                  : "text-gray-300 hover:text-gray-400"
              }`}
              title={user ? (isBookmarked ? "Remove from saved" : "Save question") : "Login to save"}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>

        {/* Question Title */}
        <h3 className="text-base font-semibold text-gray-900 leading-snug mb-4 line-clamp-3 flex-shrink-0">
          {question.question}
        </h3>

        {/* Metadata */}
        <div className="space-y-2 flex-1 mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-gray-400 min-w-[70px]">Company</span>
            <span className="text-sm text-gray-700">{question.company}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-gray-400 min-w-[70px]">Category</span>
            <span className="text-sm text-gray-700">{question.category}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-gray-400 min-w-[70px]">Stage</span>
            <span className="text-sm text-gray-700">{question.interview_stage}</span>
          </div>
        </div>

        {/* Footer: Thumbs up + Date + View Question */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <button
              onClick={() => user && toggleThumbsUp()}
              disabled={isToggling || !user}
              className={`flex items-center gap-1 transition-colors ${
                hasThumbsUp ? "text-primary" : "hover:text-gray-600"
              }`}
              title={user ? (hasThumbsUp ? "Remove thumbs up" : "Thumbs up") : "Login to vote"}
            >
              <ThumbsUp className={`w-4 h-4 ${hasThumbsUp ? "fill-current" : ""}`} />
              <span>{thumbsUpCount}</span>
            </button>
            <span>Added {new Date(question.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</span>
          </div>
          
          {onViewQuestion ? (
            <button
              onClick={onViewQuestion}
              className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              View Question
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
              <DialogTrigger asChild>
                <button className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                  View Question
                  <ArrowRight className="w-4 h-4" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">Question Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {question.recommended && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                      <Badge className="bg-primary/10 text-primary border-0 text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 text-center">
                        {question.role}
                      </Badge>
                    </div>
                    <Button
                      variant={hasThumbsUp ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleThumbsUp()}
                      disabled={isToggling || !user}
                      className={`flex items-center gap-1.5 ${
                        hasThumbsUp 
                          ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                          : ""
                      }`}
                      title={user ? (hasThumbsUp ? "Remove thumbs up" : "Thumbs up this question") : "Login to thumbs up"}
                    >
                      <ThumbsUp className={`w-4 h-4 ${hasThumbsUp ? "fill-current" : ""}`} />
                      <span>{thumbsUpCount}</span>
                    </Button>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Question</h3>
                    <p className="text-sm text-muted-foreground break-words">{question.question}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-foreground">Company:</span>
                      <p className="text-sm text-muted-foreground break-words">{question.company}</p>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Category:</span>
                      <p className="text-sm text-muted-foreground break-words">{question.category}</p>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Stage:</span>
                      <p className="text-sm text-muted-foreground break-words">{question.interview_stage}</p>
                    </div>
                  </div>
                  
                  {question.additional_context && (
                    <div>
                      <h3 className="font-medium text-foreground mb-2">Additional Context</h3>
                      <div className="p-3 bg-muted rounded-md border border-border overflow-hidden">
                        <RichTextDisplay 
                          content={question.additional_context} 
                          className="text-sm break-words overflow-wrap-anywhere max-w-full [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_pre]:break-words [&_pre]:whitespace-pre-wrap [&_code]:break-words [&_code]:whitespace-pre-wrap [&_pre]:bg-background [&_pre]:border [&_pre]:border-border [&_pre]:shadow-sm" 
                        />
                      </div>
                    </div>
                  )}
                  
                  {(question.team || question.position_name) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {question.team && (
                        <div>
                          <span className="font-medium text-foreground">Team:</span>
                          <p className="text-sm text-muted-foreground break-words">{question.team}</p>
                        </div>
                      )}
                      {question.position_name && (
                        <div>
                          <span className="font-medium text-foreground">Position:</span>
                          <p className="text-sm text-muted-foreground break-words">{question.position_name}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {(question.source_url || question.source_website) && (
                    <div>
                      <h3 className="font-medium text-foreground mb-2">Source Information</h3>
                      <div className="space-y-1">
                        {question.source_website && (
                          <div>
                            <span className="font-medium text-foreground">Website:</span>
                            <p className="text-sm text-muted-foreground break-words">{question.source_website}</p>
                          </div>
                        )}
                        {question.source_url && (
                          <div>
                            <span className="font-medium text-foreground">URL:</span>
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
          )}
        </div>
      </div>
    </>
  );
};

export default QuestionCard;
