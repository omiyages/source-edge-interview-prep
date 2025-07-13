
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { OptimizedResourcesList } from "./OptimizedResourcesList";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string;
  category: string;
}

interface ManageStageResourcesFormProps {
  stageId: string;
  onSuccess: () => void;
}

export const ManageStageResourcesForm = ({ stageId, onSuccess }: ManageStageResourcesFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all available resources
  const { data: allResources, isLoading: isLoadingResources } = useQuery({
    queryKey: ['all-resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Resource[];
    },
  });

  // Fetch currently assigned resources
  const { data: currentResources, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ['current-stage-resources', stageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stage_resources')
        .select('resource_id')
        .eq('stage_id', stageId);
      
      if (error) throw error;
      return new Set(data.map(item => item.resource_id));
    },
  });

  // Initialize selected resources when current resources are loaded
  useState(() => {
    if (currentResources) {
      setSelectedResources(currentResources);
    }
  }, [currentResources]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // First, remove all existing resources for this stage
      const { error: deleteError } = await supabase
        .from('stage_resources')
        .delete()
        .eq('stage_id', stageId);

      if (deleteError) throw deleteError;

      // Then, add the selected resources
      if (selectedResources.size > 0) {
        const resourcesToInsert = Array.from(selectedResources).map(resourceId => ({
          stage_id: stageId,
          resource_id: resourceId,
        }));

        const { error: insertError } = await supabase
          .from('stage_resources')
          .insert(resourcesToInsert);

        if (insertError) throw insertError;
      }

      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['stage-resources-display', stageId] });
      queryClient.invalidateQueries({ queryKey: ['current-stage-resources', stageId] });

      toast({
        title: "Resources updated!",
        description: `Successfully assigned ${selectedResources.size} resources to this stage.`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error updating stage resources:', error);
      toast({
        title: "Error",
        description: "Failed to update resources. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleResource = (resourceId: string) => {
    const newSelected = new Set(selectedResources);
    if (newSelected.has(resourceId)) {
      newSelected.delete(resourceId);
    } else {
      newSelected.add(resourceId);
    }
    setSelectedResources(newSelected);
  };

  if (isLoadingResources || isLoadingCurrent) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading resources...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Select Resources ({selectedResources.size} selected)</h3>
      </div>

      <div className="max-h-96 overflow-y-auto">
        <OptimizedResourcesList
          resources={allResources || []}
          selectedResources={selectedResources}
          onToggleResource={toggleResource}
        />
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};
