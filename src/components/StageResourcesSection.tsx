
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Plus, Settings2 } from "lucide-react";
import { useEffect, useRef } from "react";

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

  // Debounce timer ref for real-time updates
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Set up real-time subscription for stage resources with debouncing
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
          // Debounce the update to prevent rapid refetches
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          debounceTimerRef.current = setTimeout(() => {
            refetch();
          }, 300);
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription for stage resources');
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [stageId, refetch]);

  if (isLoading) {
    return (
      <Card className="bg-white border-border shadow-sm h-full">
        <CardContent className="py-8">
          <div className="text-center">Loading resources...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-border shadow-sm h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Learning Resources</CardTitle>
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onManageClick}
              className="text-primary hover:text-primary/80"
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Manage
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!stageResources || stageResources.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No resources assigned to this stage yet.</p>
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
          <div className="space-y-3">
            {stageResources.map((resource) => (
                        <div
                          key={resource.id}
                className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow bg-white shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant="secondary"
                        className="text-xs font-medium uppercase"
                      >
                        {resource.category}
                      </Badge>
                    </div>
                    <h5 className="font-semibold text-sm mb-1 text-foreground">{resource.title}</h5>
                              {resource.description && (
                      <p className="text-sm text-muted-foreground mb-2">{resource.description}</p>
                              )}
                            </div>
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                    className="flex-shrink-0 p-2 text-muted-foreground hover:text-foreground rounded-md transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
