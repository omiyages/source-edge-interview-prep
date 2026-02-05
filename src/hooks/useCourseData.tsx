import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  title: string;
  description: string | null;
  company: string | null;
  attached_jobs: string[] | null;
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
  team: string | null;
  position_name: string | null;
}

export const useCourseData = (slug: string | undefined, user: any) => {
  // Fetch course AND stages together using direct slug lookup
  const { data: courseData, refetch: refetchCourseData, isLoading: isLoadingCourse } = useQuery({
    queryKey: ['course-with-stages', slug],
    queryFn: async () => {
      console.log('🔄 Fetching course with stages for slug:', slug);
      
      // Direct lookup by slug - much faster than fetching all courses
      const { data: course, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          company,
          attached_jobs,
          created_at,
          course_stages (
            id,
            title,
            description,
            information,
            stage_order
          )
        `)
        .eq('slug', slug)
        .order('stage_order', { referencedTable: 'course_stages' })
        .maybeSingle();
      
      if (error) {
        console.error('❌ Error fetching course:', error);
        throw error;
      }
      
      if (!course) {
        throw new Error('Course not found');
      }
      
      // Extract stages and sort them
      const stages = (course.course_stages || []).sort((a, b) => a.stage_order - b.stage_order);
      
      console.log('✅ Course and stages fetched:', course.title, stages.length, 'stages');
      
      // Return course without the nested stages (to match expected interface)
      const { course_stages, ...courseWithoutStages } = course;
      return {
        course: courseWithoutStages as Course,
        stages: stages as CourseStage[]
      };
    },
    enabled: !!user && !!slug,
    staleTime: 30000, // Cache for 30 seconds
  });

  return {
    course: courseData?.course,
    stages: courseData?.stages,
    refetchCourse: refetchCourseData,
    refetchStages: refetchCourseData,
    isLoadingCourse,
  };
};

export const useStageQuestions = (selectedStage: CourseStage | null) => {
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

  return { stageQuestions, refetchQuestions };
};

export const useUserProgress = (user: any, courseId: string | undefined) => {
  const { data: userProgress } = useQuery({
    queryKey: ['user-progress', courseId, user?.id],
    queryFn: async () => {
      if (!user || !courseId) return [];
      
      const { data, error } = await supabase
        .from('user_progress')
        .select('id, stage_id, completed_at')
        .eq('user_id', user.id)
        .eq('course_id', courseId);
      
      if (error) {
        console.error('❌ Error fetching user progress:', error);
        throw error;
      }
      return data;
    },
    enabled: !!user && !!courseId,
    staleTime: 30000, // Cache for 30 seconds
  });

  return { userProgress };
};
