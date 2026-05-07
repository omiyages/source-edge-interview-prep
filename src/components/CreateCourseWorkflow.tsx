
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useClerkSupabase } from "@/hooks/useClerkSupabase";
import { useToast } from "@/hooks/use-toast";
import { CreateCourseStep1 } from "./CreateCourseStep1";
import { CreateCourseStep2 } from "./CreateCourseStep2";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CourseStage {
  title: string;
  description: string;
  information: string;
  stage_order: number;
}

interface CreateCourseWorkflowProps {
  onSuccess: () => void;
  initialCourseData?: {
    title: string;
    description: string;
    company: string;
    attachedJobs: string[];
  };
  initialStages?: CourseStage[];
}

export const CreateCourseWorkflow = ({ onSuccess, initialCourseData, initialStages }: CreateCourseWorkflowProps) => {
  const { user, hasClerkJwt, clerkClientReady, refreshClerkToken } = useAuth();
  const { client: supabase } = useClerkSupabase();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [createdStageIds, setCreatedStageIds] = useState<string[]>([]);
  const [stageAssignments, setStageAssignments] = useState<Record<string, { questionsAssigned: boolean; resourcesAssigned: boolean }>>({});
  
  const [courseData, setCourseData] = useState({
    title: initialCourseData?.title || "",
    description: initialCourseData?.description || "",
    company: initialCourseData?.company || "",
    attachedJobs: initialCourseData?.attachedJobs || [],
  });
  
  const [stages, setStages] = useState<CourseStage[]>(
    initialStages && initialStages.length > 0 
      ? initialStages 
      : [
          {
            title: "Stage 1",
            description: "",
            information: "",
            stage_order: 1
          }
        ]
  );

  const createCourseMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error("You must be signed in to create a course.");
      }

      // Ensure the Clerk JWT has been set on the singleton client before any RLS queries.
      // Without it, PostgREST will frequently respond 401 for authenticated-only tables.
      if (!clerkClientReady || !hasClerkJwt) {
        await refreshClerkToken?.();
      }

      // Create the course
      const { data: courseData_, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: courseData.title,
          description: courseData.description,
          company: courseData.company,
          attached_jobs: courseData.attachedJobs,
          created_by: user.id,
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // Create the stages
      const stageInserts = stages.map((stage, index) => ({
        course_id: courseData_.id,
        title: stage.title,
        description: stage.description,
        information: stage.information,
        stage_order: index + 1,
      }));

      const { data: stagesData, error: stagesError } = await supabase
        .from('course_stages')
        .insert(stageInserts)
        .select();

      if (stagesError) throw stagesError;
      
      return { course: courseData_, stages: stagesData };
    },
    onSuccess: ({ course, stages: stagesData }) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setCreatedCourseId(course.id);
      
      const stageIds = stagesData.map(stage => stage.id);
      setCreatedStageIds(stageIds);

      // Initialize stage assignments tracking
      const initialAssignments: Record<string, { questionsAssigned: boolean; resourcesAssigned: boolean }> = {};
      stageIds.forEach(id => {
        initialAssignments[id] = { questionsAssigned: false, resourcesAssigned: false };
      });
      setStageAssignments(initialAssignments);

      toast({
        title: "Course Created!",
        description: "Course and stages created successfully. You can now assign questions and resources to each stage.",
      });
    },
    onError: (error) => {
      console.error('Error creating course:', error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateCourse = () => {
    createCourseMutation.mutate();
  };

  const handleAssignmentSuccess = (stageId: string, type: 'questions' | 'resources') => {
    setStageAssignments(prev => ({
      ...prev,
      [stageId]: {
        ...prev[stageId],
        [`${type}Assigned`]: true
      }
    }));
  };

  const handleFinish = () => {
    toast({
      title: "Course Setup Complete!",
      description: "Your course has been created successfully with all stages and assignments.",
    });
    onSuccess();
  };

  if (currentStep === 1) {
    return (
      <CreateCourseStep1
        courseData={courseData}
        setCourseData={setCourseData}
        onNext={() => setCurrentStep(2)}
      />
    );
  }

  if (currentStep === 2) {
    return (
      <CreateCourseStep2
        courseData={courseData}
        stages={stages}
        setStages={setStages}
        createdCourseId={createdCourseId}
        createdStageIds={createdStageIds}
        stageAssignments={stageAssignments}
        isSubmitting={createCourseMutation.isPending}
        onBack={() => setCurrentStep(1)}
        onCreateCourse={handleCreateCourse}
        onFinish={handleFinish}
        onAssignmentSuccess={handleAssignmentSuccess}
      />
    );
  }

  return null;
};
