import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/utils/slugify";

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
  const { data: course, refetch: refetchCourse, isLoading: isLoadingCourse } = useQuery({
    queryKey: ['course', slug],
    queryFn: async () => {
      console.log('🔄 Fetching course with slug:', slug);
      
      // First get all courses to find the one with matching slug
      const { data: courses, error } = await supabase
        .from('courses')
        .select('*');
      
      if (error) {
        console.error('❌ Error fetching courses:', error);
        throw error;
      }
      
      // Find course by matching slug
      const course = courses?.find(c => slugify(c.title) === slug);
      
      if (!course) {
        throw new Error('Course not found');
      }
      
      console.log('✅ Course fetched:', course);
      return course as Course;
    },
    enabled: !!user && !!slug,
  });

  const { data: stages, refetch: refetchStages } = useQuery({
    queryKey: ['course-stages', course?.id],
    queryFn: async () => {
      if (!course?.id) return [];
      
      console.log('🔄 Fetching stages for course:', course.id);
      const { data, error } = await supabase
        .from('course_stages')
        .select('*')
        .eq('course_id', course.id)
        .order('stage_order');
      
      if (error) {
        console.error('❌ Error fetching stages:', error);
        throw error;
      }
      console.log('✅ Stages fetched:', data?.length || 0);
      return data as CourseStage[];
    },
    enabled: !!user && !!course?.id,
  });

  return {
    course,
    stages,
    refetchCourse,
    refetchStages,
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
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId);
      
      if (error) {
        console.error('❌ Error fetching user progress:', error);
        throw error;
      }
      return data;
    },
    enabled: !!user && !!courseId,
  });

  return { userProgress };
};
