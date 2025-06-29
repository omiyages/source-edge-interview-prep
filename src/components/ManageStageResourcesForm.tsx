
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, ExternalLink } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all available resources
  const { data: allResources, isLoading: loadingAllResources } = useQuery({
    queryKey: ['all-resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('title');
      
      if (error) throw error;
      return data as Resource[];
    },
  });

  // Fetch currently assigned resources for this stage
  const { data: currentResources, isLoading: loadingCurrentResources } = useQuery({
    queryKey: ['stage-resources', stageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stage_resources')
        .select(`
          resource_id,
          resources (*)
        `)
        .eq('stage_id', stageId);
      
      if (error) throw error;
      return data.map(item => item.resources) as Resource[];
    },
  });

  // Initialize selected resources when current resources are loaded
  useEffect(() => {
    if (currentResources) {
      setSelectedResources(currentResources.map(resource => resource.id));
    }
  }, [currentResources]);

  const handleResourceToggle = (resourceId: string) => {
    setSelectedResources(prev => 
      prev.includes(resourceId)
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Remove all current associations
      const { error: deleteError } = await supabase
        .from('stage_resources')
        .delete()
        .eq('stage_id', stageId);

      if (deleteError) throw deleteError;

      // Add new associations
      if (selectedResources.length > 0) {
        const resourceAssociations = selectedResources.map(resourceId => ({
          stage_id: stageId,
          resource_id: resourceId,
        }));

        const { error: insertError } = await supabase
          .from('stage_resources')
          .insert(resourceAssociations);

        if (insertError) throw insertError;
      }

      toast({
        title: "Resources updated!",
        description: `${selectedResources.length} resources assigned to this stage.`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error updating stage resources:', error);
      toast({
        title: "Error",
        description: "Failed to update stage resources. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingAllResources || loadingCurrentResources) {
    return <div className="text-center py-4">Loading resources...</div>;
  }

  const availableResources = allResources || [];
  const resourcesByCategory = availableResources.reduce((acc, resource) => {
    if (!acc[resource.category]) {
      acc[resource.category] = [];
    }
    acc[resource.category].push(resource);
    return acc;
  }, {} as Record<string, Resource[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Manage Stage Resources</h3>
          <p className="text-sm text-gray-600">
            Select resources to assign to this stage ({selectedResources.length} selected)
          </p>
        </div>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Resources"}
        </Button>
      </div>

      {Object.keys(resourcesByCategory).length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No resources available. Create some resources first.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(resourcesByCategory).map(([category, resources]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge variant="secondary">{category}</Badge>
                  <span className="text-xs text-gray-500">
                    ({resources.filter(r => selectedResources.includes(r.id)).length}/{resources.length} selected)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={selectedResources.includes(resource.id)}
                      onCheckedChange={() => handleResourceToggle(resource.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{resource.title}</h4>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      {resource.description && (
                        <p className="text-xs text-gray-600 mt-1">{resource.description}</p>
                      )}
                      <p className="text-xs text-blue-600 mt-1 truncate">{resource.url}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
