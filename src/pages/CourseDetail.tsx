
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CourseHeader } from "@/components/CourseHeader";
import { StageNavigation } from "@/components/StageNavigation";
import { StageInformation } from "@/components/StageInformation";
import { StageResourcesSection } from "@/components/StageResourcesSection";
import { StageQuestions } from "@/components/StageQuestions";

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
        <CourseHeader
          course={course}
          selectedStage={selectedStage}
          isAdmin={isAdmin}
          onCourseUpdate={() => {
            refetchCourse();
            refetchStages();
          }}
          onQuestionsUpdate={refetchQuestions}
        />

        <StageNavigation
          stages={stages || []}
          selectedStage={selectedStage}
          onStageSelect={setSelectedStage}
        />

        {/* Selected Stage Content */}
        {selectedStage && (
          <div className="space-y-8">
            <StageInformation selectedStage={selectedStage} />

            <StageResourcesSection
              stageId={selectedStage.id}
              isAdmin={isAdmin}
              onManageClick={() => {}}
            />

            <StageQuestions
              questions={stageQuestions}
              isAdmin={isAdmin}
              onManageClick={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;
