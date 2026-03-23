// ABOUTME: Hook for managing stage templates - loading, saving, and applying templates to course stages
// ABOUTME: Provides functionality to save stages as reusable templates and load them for new courses

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export interface StageTemplate {
  id: string;
  name: string;
  title: string;
  description: string | null;
  information: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CourseStage {
  id?: string;
  title: string;
  description: string;
  information: string;
  stage_order: number;
}

export const useStageTemplates = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch all stage templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ["stage-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stage_templates")
        .select("id, name, title, description, information, created_at")
        .order("name");

      if (error) throw error;
      return data as StageTemplate[];
    },
  });

  // Save a stage as a template
  const saveTemplateMutation = useMutation({
    mutationFn: async ({
      name,
      stage,
    }: {
      name: string;
      stage: CourseStage;
    }) => {
      const { data, error } = await supabase
        .from("stage_templates")
        .insert({
          name,
          title: stage.title,
          description: stage.description,
          information: stage.information,
          created_by: user?.id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stage-templates"] });
      toast.success("Stage template saved successfully!");
    },
    onError: (error) => {
      console.error("Error saving template:", error);
      toast.error("Failed to save stage template");
    },
  });

  // Apply a template to a stage
  const applyTemplate = (template: StageTemplate): Partial<CourseStage> => {
    return {
      title: template.title,
      description: template.description || "",
      information: template.information || "",
    };
  };

  return {
    templates: templates || [],
    isLoading,
    saveTemplate: saveTemplateMutation.mutate,
    isSaving: saveTemplateMutation.isPending,
    applyTemplate,
  };
};