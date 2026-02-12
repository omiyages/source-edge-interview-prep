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
        throw error;
      }
      
      if (!course) {
        throw new Error('Course not found');
      }
      
      // Extract stages and sort them
      const stages = (course.course_stages || []).sort((a, b) => a.stage_order - b.stage_order);
      
      // Return course without the nested stages (to match expected interface)
      const { course_stages, ...courseWithoutStages } = course;
      return {
        course: courseWithoutStages as Course,
        stages: stages as CourseStage[]
      };
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes — course content rarely changes
    gcTime: 10 * 60 * 1000, // 10 minutes
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
      
      const { data, error } = await supabase
        .from('stage_questions')
        .select(`
          question_id,
          interview_questions (*)
        `)
        .eq('stage_id', selectedStage.id);
      
      if (error) {
        throw error;
      }
      return data.map(item => item.interview_questions) as InterviewQuestion[];
    },
    enabled: !!selectedStage,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return { stageQuestions, refetchQuestions };
};

/**
 * Batch-fetch all stage questions for a course in one query, then populate
 * each individual stage's cache. This eliminates N+1 queries when viewing
 * a course detail page.
 */
export const useBatchStageQuestions = (stageIds: string[]) => {
  const { data } = useQuery({
    queryKey: ['batch-stage-questions', stageIds],
    queryFn: async () => {
      if (stageIds.length === 0) return {};

      const { data: rows, error } = await supabase
        .from('stage_questions')
        .select(`
          stage_id,
          question_id,
          interview_questions (*)
        `)
        .in('stage_id', stageIds);

      if (error) throw error;

      // Group questions by stage_id
      const grouped: Record<string, InterviewQuestion[]> = {};
      for (const row of rows || []) {
        if (!grouped[row.stage_id]) grouped[row.stage_id] = [];
        if (row.interview_questions) {
          grouped[row.stage_id].push(row.interview_questions as unknown as InterviewQuestion);
        }
      }
      return grouped;
    },
    enabled: stageIds.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return { questionsByStage: data || {} };
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
        throw error;
      }
      return data;
    },
    enabled: !!user && !!courseId,
    staleTime: 30000, // Cache for 30 seconds
  });

  return { userProgress };
};
