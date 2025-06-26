import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Briefcase, Clock, Globe, User, ThumbsUp, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EditQuestionForm } from "@/components/EditQuestionForm";
import { useToast } from "@/hooks/use-toast";

interface InterviewQuestion {
  id: string;
  question: string;
  company: string;
  role: string;
  difficulty: string;
  interview_stage: string;
  category: string;
  submitted_by: string | null;
  additional_context: string | null;
  created_at: string;
  question_type: string;
  source_url: string | null;
  source_website: string | null;
  scraped_at: string | null;
}

interface QuestionCardProps {
  question: InterviewQuestion;
}

const QuestionCard = ({ question }: QuestionCardProps) => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: likesCount } = useQuery({
    queryKey: ['question-likes-count', question.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('question_likes')
        .select('*', { count: 'exact', head: true })
        .eq('question_id', question.id);
      
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: userLiked } = useQuery({
    queryKey: ['user-liked', question.id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('question_likes')
        .select('id')
        .eq('question_id', question.id)
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
    enabled: !!user,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      if (userLiked) {
        // Unlike
        const { error } = await supabase
          .from('question_likes')
          .delete()
          .eq('question_id', question.id)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('question_likes')
          .insert({
            question_id: question.id,
            user_id: user.id,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-likes-count', question.id] });
      queryClient.invalidateQueries({ queryKey: ['user-liked', question.id, user?.id] });
      
      toast({
        title: userLiked ? "Like removed" : "Question liked!",
        description: userLiked ? "You've unliked this question." : "Thanks for your feedback!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update like status.",
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Technical': return <Building2 className="w-4 h-4" />;
      case 'Behavioral': return <Briefcase className="w-4 h-4" />;
      case 'System Design': return <Building2 className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    return type === 'online_sourced' ? <Globe className="w-4 h-4" /> : <User className="w-4 h-4" />;
  };

  const getQuestionTypeColor = (type: string) => {
    return type === 'online_sourced' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {getCategoryIcon(question.category)}
            <span className="text-sm font-medium text-gray-600 truncate">
              {question.category}
            </span>
          </div>
          <div className="flex gap-2">
            <Badge className={getRoleTypeColor(question.role)}>
              {question.role}
            </Badge>
            <Badge className={getQuestionTypeColor(question.question_type)}>
              <div className="flex items-center gap-1">
                {getQuestionTypeIcon(question.question_type)}
                <span className="text-xs">
                  {question.question_type === 'online_sourced' ? 'Sourced' : 'User'}
                </span>
              </div>
            </Badge>
            {isAdmin && (
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                    <Edit className="w-3 h-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Question</DialogTitle>
                  </DialogHeader>
                  <EditQuestionForm 
                    question={question}
                    onSuccess={() => {
                      setIsEditDialogOpen(false);
                      queryClient.invalidateQueries({ queryKey: ['stage-questions'] });
                      queryClient.invalidateQueries({ queryKey: ['all-questions'] });
                      toast({
                        title: "Question updated",
                        description: "The question has been successfully updated.",
                      });
                    }} 
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        <CardTitle className="text-lg leading-tight">
          {question.question}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400" />
            <span className="font-semibold text-gray-900">{question.company}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{question.role}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">{question.interview_stage}</span>
          </div>
          
          {question.source_url && (
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-400" />
              <a 
                href={question.source_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline truncate"
              >
                {question.source_website}
              </a>
            </div>
          )}
          
          {question.additional_context && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">
                {question.additional_context}
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t">
            <span>By {question.submitted_by || 'Anonymous'}</span>
            <div className="flex items-center gap-2">
              <span>{new Date(question.created_at).toLocaleDateString()}</span>
              {user && (
                <Button
                  size="sm"
                  variant={userLiked ? "default" : "outline"}
                  className="h-8 px-2"
                  onClick={() => likeMutation.mutate()}
                  disabled={likeMutation.isPending}
                >
                  <ThumbsUp className={`w-3 h-3 mr-1 ${userLiked ? 'fill-current' : ''}`} />
                  {likesCount || 0}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
