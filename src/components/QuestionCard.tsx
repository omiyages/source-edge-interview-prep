// ABOUTME: This component displays individual interview question cards with view/edit/delete functionality
// ABOUTME: It handles question display, admin actions, and detailed question viewing in modal dialogs

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Edit, Star, Eye, X, ThumbsUp, Bookmark } from "lucide-react";
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

  // Colorful tag color schemes
  const getRoleTypeColor = (roleType: string) => {
    const lower = roleType.toLowerCase();
    
    // Backend related
    if (lower.includes('backend') || lower.includes('server')) {
      return 'bg-blue-100 text-blue-700 border-blue-300';
    }
    // Frontend related
    if (lower.includes('frontend') || lower.includes('ui') || lower.includes('web')) {
      return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    }
    // Full stack
    if (lower.includes('full stack') || lower.includes('fullstack')) {
      return 'bg-violet-100 text-violet-700 border-violet-300';
    }
    // Mobile
    if (lower.includes('mobile') || lower.includes('ios') || lower.includes('android')) {
      return 'bg-pink-100 text-pink-700 border-pink-300';
    }
    // DevOps/SRE/Infrastructure
    if (lower.includes('devops') || lower.includes('sre') || lower.includes('infrastructure') || lower.includes('platform')) {
      return 'bg-orange-100 text-orange-700 border-orange-300';
    }
    // Data/ML/AI
    if (lower.includes('data') || lower.includes('ml') || lower.includes('machine learning') || lower.includes('ai')) {
      return 'bg-cyan-100 text-cyan-700 border-cyan-300';
    }
    // Embedded/Systems
    if (lower.includes('embedded') || lower.includes('systems') || lower.includes('firmware')) {
      return 'bg-amber-100 text-amber-700 border-amber-300';
    }
    // Security
    if (lower.includes('security') || lower.includes('cyber')) {
      return 'bg-red-100 text-red-700 border-red-300';
    }
    // QA/Testing
    if (lower.includes('qa') || lower.includes('test') || lower.includes('quality')) {
      return 'bg-teal-100 text-teal-700 border-teal-300';
    }
    // Manager/Lead
    if (lower.includes('manager') || lower.includes('lead') || lower.includes('director')) {
      return 'bg-purple-100 text-purple-700 border-purple-300';
    }
    // Product
    if (lower.includes('product')) {
      return 'bg-indigo-100 text-indigo-700 border-indigo-300';
    }
    // Design
    if (lower.includes('design') || lower.includes('ux')) {
      return 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300';
    }
    // Cloud
    if (lower.includes('cloud') || lower.includes('aws') || lower.includes('azure') || lower.includes('gcp')) {
      return 'bg-sky-100 text-sky-700 border-sky-300';
    }
    // Software Engineer (generic) - use a nice color instead of gray
    if (lower.includes('software') || lower.includes('engineer')) {
      return 'bg-slate-100 text-slate-700 border-slate-300';
    }
    
    // Fallback with hash-based color for variety
    const colors = [
      'bg-rose-100 text-rose-700 border-rose-300',
      'bg-lime-100 text-lime-700 border-lime-300',
      'bg-amber-100 text-amber-700 border-amber-300',
      'bg-cyan-100 text-cyan-700 border-cyan-300',
      'bg-violet-100 text-violet-700 border-violet-300',
    ];
    const hash = roleType.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Get color for company tag
  const getCompanyColor = (company: string) => {
    const colors = [
      'bg-indigo-100 text-indigo-700 border-indigo-300',
      'bg-emerald-100 text-emerald-700 border-emerald-300',
      'bg-amber-100 text-amber-700 border-amber-300',
      'bg-rose-100 text-rose-700 border-rose-300',
      'bg-cyan-100 text-cyan-700 border-cyan-300',
      'bg-purple-100 text-purple-700 border-purple-300',
      'bg-teal-100 text-teal-700 border-teal-300',
      'bg-orange-100 text-orange-700 border-orange-300',
    ];
    const hash = company.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Get color for category tag
  const getCategoryColor = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('behavioral')) return 'bg-pink-100 text-pink-700 border-pink-300';
    if (lower.includes('technical')) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (lower.includes('system')) return 'bg-purple-100 text-purple-700 border-purple-300';
    if (lower.includes('coding')) return 'bg-green-100 text-green-700 border-green-300';
    if (lower.includes('design')) return 'bg-violet-100 text-violet-700 border-violet-300';
    
    const colors = [
      'bg-sky-100 text-sky-700 border-sky-300',
      'bg-lime-100 text-lime-700 border-lime-300',
      'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300',
    ];
    const hash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Determine which icon and tooltip to show
  const deleteIcon = stageId && onRemoveFromStage ? X : Trash2;
  const deleteTooltip = stageId && onRemoveFromStage 
    ? "Remove from course" 
    : "Delete question permanently";

  return (
    <>
      <Card className="group h-full flex flex-col bg-white hover:shadow-md transition-all duration-200 border border-border hover:border-border/80">
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
          <CardTitle className="text-sm font-medium leading-relaxed text-foreground line-clamp-3">
            {question.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 flex-1 flex flex-col space-y-3">
          {/* Colorful Tags */}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className={`text-xs font-medium px-2 py-0.5 ${getCompanyColor(question.company)}`}>
              {question.company}
            </Badge>
            <Badge variant="outline" className={`text-xs font-medium px-2 py-0.5 ${getCategoryColor(question.category)}`}>
              {question.category}
            </Badge>
          </div>
          
          <div className="space-y-2 flex-1">
            <div className="text-xs text-muted-foreground flex items-center justify-between">
              <span>
                <span className="font-medium text-foreground">Stage:</span> {question.interview_stage}
              </span>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleBookmark()}
                                  disabled={isBookmarkToggling || !user}
                                  className={`h-6 w-6 p-0 ${
                                    isBookmarked 
                                      ? "text-primary hover:text-primary/80" 
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                  title={user ? (isBookmarked ? "Remove from saved" : "Save question") : "Login to save"}
                                >
                                  <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-current" : ""}`} />
                                </Button>
                                <Button
                                  variant={hasThumbsUp ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => toggleThumbsUp()}
                                  disabled={isToggling || !user}
                                  className={`flex items-center gap-1.5 text-xs h-6 px-2 ${
                                    hasThumbsUp 
                                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                                      : "border-border hover:bg-muted"
                                  }`}
                                  title={user ? (hasThumbsUp ? "Remove thumbs up" : "Thumbs up this question") : "Login to thumbs up"}
                                >
                                  <ThumbsUp className={`w-3 h-3 ${hasThumbsUp ? "fill-current" : ""}`} />
                                  <span>{thumbsUpCount}</span>
                                </Button>
                              </div>
                            </div>
          </div>

          {/* View Question Button */}
          <div className="pt-2">
            {onViewQuestion ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-border hover:bg-muted"
                onClick={onViewQuestion}
              >
                <Eye className="w-3 h-3 mr-1" />
                View Question
              </Button>
            ) : (
              <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs border-border hover:bg-muted"
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
                    <div className="flex flex-wrap gap-2 items-center justify-between">
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
                      <div className="flex items-center gap-2">
                        <Button
                          variant={isBookmarked ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleBookmark()}
                          disabled={isBookmarkToggling || !user}
                          className={`flex items-center gap-1.5 ${
                            isBookmarked 
                              ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                              : ""
                          }`}
                          title={user ? (isBookmarked ? "Remove from saved" : "Save question") : "Login to save"}
                        >
                          <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
                          {isBookmarked ? "Saved" : "Save"}
                        </Button>
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
          
          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
            Added {new Date(question.created_at).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default QuestionCard;
