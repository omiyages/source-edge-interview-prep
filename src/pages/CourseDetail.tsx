
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Settings2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ManageStageQuestionsForm } from "@/components/ManageStageQuestionsForm";
import QuestionCard from "@/components/QuestionCard";

interface Course {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

interface CourseStage {
  id: string;
  title: string;
  description: string | null;
  stage_order: number;
}

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

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, loading, isAdmin } = useAuth();
  const [selectedStage, setSelectedStage] = useState<CourseStage | null>(null);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);

  // Redirect to auth if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (error) throw error;
      return data as Course;
    },
    enabled: !!user && !!courseId,
  });

  const { data: stages } = useQuery({
    queryKey: ['course-stages', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_stages')
        .select('*')
        .eq('course_id', courseId)
        .order('stage_order');
      
      if (error) throw error;
      return data as CourseStage[];
    },
    enabled: !!user && !!courseId,
  });

  const { data: stageQuestions, refetch: refetchQuestions } = useQuery({
    queryKey: ['stage-questions', selectedStage?.id],
    queryFn: async () => {
      if (!selectedStage) return [];
      
      const { data, error } = await supabase
        .from('stage_questions')
        .select(`
          question_id,
          interview_questions (*)
        `)
        .eq('stage_id', selectedStage.id);
      
      if (error) throw error;
      return data.map(item => item.interview_questions) as InterviewQuestion[];
    },
    enabled: !!selectedStage,
  });

  useEffect(() => {
    if (stages && stages.length > 0 && !selectedStage) {
      setSelectedStage(stages[0]);
    }
  }, [stages, selectedStage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h1>
          <Button onClick={() => window.location.href = '/track'}>
            Back to Tracks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/track'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tracks
          </Button>
          
          {isAdmin && selectedStage && (
            <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings2 className="w-4 h-4 mr-2" />
                  Manage Questions
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Manage Questions for {selectedStage.title}</DialogTitle>
                </DialogHeader>
                <ManageStageQuestionsForm 
                  stageId={selectedStage.id}
                  onSuccess={() => {
                    setIsManageDialogOpen(false);
                    refetchQuestions();
                  }} 
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Course Info */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{course.title}</h1>
          {course.description && (
            <p className="text-lg text-gray-600 max-w-3xl">{course.description}</p>
          )}
        </div>

        {/* Stage Navigation */}
        {stages && stages.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {stages.map((stage, index) => (
                <Button
                  key={stage.id}
                  variant={selectedStage?.id === stage.id ? "default" : "outline"}
                  onClick={() => setSelectedStage(stage)}
                  className="flex items-center gap-2"
                >
                  <Badge variant="secondary" className="text-xs">
                    {index + 1}
                  </Badge>
                  {stage.title}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Stage Content */}
        {selectedStage && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge>{selectedStage.stage_order}</Badge>
                  {selectedStage.title}
                </CardTitle>
                {selectedStage.description && (
                  <p className="text-gray-600 mt-2">{selectedStage.description}</p>
                )}
              </CardHeader>
              <CardContent>
                {stageQuestions && stageQuestions.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {stageQuestions.map((question) => (
                      <QuestionCard key={question.id} question={question} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No questions assigned to this stage yet.</p>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        onClick={() => setIsManageDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Questions
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;
