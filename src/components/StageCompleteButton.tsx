
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface StageCompleteButtonProps {
  selectedStage: { id: string; title: string } | null;
  courseId: string;
  userProgress?: Array<{ stage_id: string }>;
  isAdmin: boolean;
}

export const StageCompleteButton = ({ 
  selectedStage, 
  courseId, 
  userProgress, 
  isAdmin 
}: StageCompleteButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const completeStageMutation = useMutation({
    mutationFn: async (stageId: string) => {
      if (!user || !courseId) throw new Error("Missing user or course ID");

      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          stage_id: stageId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Stage completed!",
        description: "Great job! You've completed this stage.",
      });
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error completing stage",
        description: error.message || "Failed to mark stage as complete.",
        variant: "destructive",
      });
    },
  });

  const isStageCompleted = (stageId: string) => {
    return userProgress?.some(p => p.stage_id === stageId) || false;
  };

  if (isAdmin || !selectedStage) return null;

  return (
    <Button
      onClick={() => completeStageMutation.mutate(selectedStage.id)}
      disabled={completeStageMutation.isPending || isStageCompleted(selectedStage.id)}
      variant={isStageCompleted(selectedStage.id) ? "outline" : "default"}
      className="w-full md:w-auto flex items-center gap-2 justify-center"
    >
      {isStageCompleted(selectedStage.id) ? (
        <>
          <CheckCircle className="h-4 w-4 text-green-600" />
          Completed
        </>
      ) : (
        <>
          <CheckCircle className="h-4 w-4" />
          {completeStageMutation.isPending ? "Completing..." : "Complete Stage"}
        </>
      )}
    </Button>
  );
};
