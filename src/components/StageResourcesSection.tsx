
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Plus, Settings2 } from "lucide-react";
import { useEffect } from "react";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string;
  category: string;
}

interface StageResourcesSectionProps {
  stageId: string;
  isAdmin: boolean;
  onManageClick: () => void;
}

export const StageResourcesSection = ({ stageId, isAdmin, onManageClick }: StageResourcesSectionProps) => {
  const { data: stageResources, isLoading, refetch } = useQuery({
    queryKey: ['stage-resources-display', stageId],
    queryFn: async () => {
      console.log('Fetching stage resources for stage:', stageId);
      const { data, error } = await supabase
        .from('stage_resources')
        .select(`
          resource_id,
          resources (*)
        `)
        .eq('stage_id', stageId);
      
      if (error) throw error;
      console.log('Stage resources fetched:', data?.length || 0);
      return data.map(item => item.resources) as Resource[];
    },
  });

  // Set up real-time subscription for stage resources
  useEffect(() => {
    console.log('Setting up real-time subscription for stage resources:', stageId);
    
    const channel = supabase
      .channel(`stage-resources-${stageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stage_resources',
          filter: `stage_id=eq.${stageId}`
        },
        (payload) => {
          console.log('Stage resources changed:', payload);
          refetch();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription for stage resources');
      supabase.removeChannel(channel);
    };
  }, [stageId, refetch]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">Loading resources...</div>
        </CardContent>
      </Card>
    );
  }

  const resourcesByCategory = (stageResources || []).reduce((acc, resource) => {
    if (!acc[resource.category]) {
      acc[resource.category] = [];
    }
    acc[resource.category].push(resource);
    return acc;
  }, {} as Record<string, Resource[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Learning Resources</CardTitle>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={onManageClick}
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Manage Resources
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {Object.keys(resourcesByCategory).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No resources assigned to this stage yet.</p>
            {isAdmin && (
              <Button
                variant="outline"
                onClick={onManageClick}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Resources
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(resourcesByCategory).map(([category, resources]) => (
              <div key={category}>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Badge variant="secondary">{category}</Badge>
                  <span className="text-sm text-gray-500">({resources.length})</span>
                </h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm mb-1">{resource.title}</h5>
                          {resource.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{resource.description}</p>
                          )}
                          <p className="text-sm text-blue-600 truncate">{resource.url}</p>
                        </div>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
