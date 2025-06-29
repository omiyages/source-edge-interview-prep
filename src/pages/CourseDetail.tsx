import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Settings2, Plus, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ManageStageQuestionsForm } from "@/components/ManageStageQuestionsForm";
import { EditCourseForm } from "@/components/EditCourseForm";
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
  information: string | null;
  stage_order: number;
}

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
}

const CourseDetail = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const { user, loading, isAdmin } = useAuth();
  const [selectedStage, setSelectedStage] = useState<CourseStage | null>(null);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isEditCourseDialogOpen, setIsEditCourseDialogOpen] = useState(false);

  // Redirect to auth if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  const { data: course, refetch: refetchCourse, isLoading: isLoadingCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      console.log('🔄 Fetching course with ID:', courseId);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (error) {
        console.error('❌ Error fetching course:', error);
        throw error;
      }
      console.log('✅ Course fetched:', data);
      return data as Course;
    },
    enabled: !!user && !!courseId,
  });

  const { data: stages, refetch: refetchStages } = useQuery({
    queryKey: ['course-stages', courseId],
    queryFn: async () => {
      console.log('🔄 Fetching stages for course:', courseId);
      const { data, error } = await supabase
        .from('course_stages')
        .select('*')
        .eq('course_id', courseId)
        .order('stage_order');
      
      if (error) {
        console.error('❌ Error fetching stages:', error);
        throw error;
      }
      console.log('✅ Stages fetched:', data?.length || 0);
      return data as CourseStage[];
    },
    enabled: !!user && !!courseId,
  });

  const { data: stageQuestions, refetch: refetchQuestions } = useQuery({
    queryKey: ['stage-questions', selectedStage?.id],
    queryFn: async () => {
      if (!selectedStage) return [];
      
      console.log('🔄 Fetching questions for stage:', selectedStage.id);
      const { data, error } = await supabase
        .from('stage_questions')
        .select(`
          question_id,
          interview_questions (*)
        `)
        .eq('stage_id', selectedStage.id);
      
      if (error) {
        console.error('❌ Error fetching stage questions:', error);
        throw error;
      }
      console.log('✅ Stage questions fetched:', data?.length || 0);
      return data.map(item => item.interview_questions) as InterviewQuestion[];
    },
    enabled: !!selectedStage,
  });

  useEffect(() => {
    if (stages && stages.length > 0 && !selectedStage) {
      setSelectedStage(stages[0]);
    }
  }, [stages, selectedStage]);

  // Function to format text with markdown-like bold syntax
  const formatText = (text: string) => {
    if (!text) return text;
    
    // Split by ** to find bold sections
    const parts = text.split('**');
    return parts.map((part, index) => {
      // Every odd index should be bold
      if (index % 2 === 1) {
        return <strong key={index}>{part}</strong>;
      }
      // Convert line breaks to <br> tags for regular text
      return part.split('\n').map((line, lineIndex, lines) => (
        <span key={`${index}-${lineIndex}`}>
          {line}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      ));
    });
  };

  if (loading || isLoadingCourse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h1>
          <p className="text-gray-600 mb-4">The course you're looking for doesn't exist or may have been removed.</p>
          <Link to="/tracks">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tracks
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/tracks">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tracks
            </Button>
          </Link>
          
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <Dialog open={isEditCourseDialogOpen} onOpenChange={setIsEditCourseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Course
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Course</DialogTitle>
                    </DialogHeader>
                    <EditCourseForm 
                      course={course}
                      onSuccess={() => {
                        setIsEditCourseDialogOpen(false);
                        refetchCourse();
                        refetchStages();
                      }} 
                    />
                  </DialogContent>
                </Dialog>
                
                {selectedStage && (
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
              </>
            )}
          </div>
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
          <div className="space-y-8">
            {/* Stage Information */}
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
              {selectedStage.information && (
                <CardContent>
                  <div className="prose prose-blue max-w-none">
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {formatText(selectedStage.information)}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Stage Questions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Practice Questions</CardTitle>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsManageDialogOpen(true)}
                    >
                      <Settings2 className="w-4 h-4 mr-2" />
                      Manage Questions
                    </Button>
                  )}
                </div>
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
