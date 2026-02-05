
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Plus } from "lucide-react";
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

  // Debounce timer ref for real-time updates
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Set up real-time subscription for stage resources with debouncing
  useEffect(() => {
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
        () => {
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
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [stageId, refetch]);

  if (isLoading) {
    return (
      <div className="h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Learning Resources</h3>
        </div>
        <div className="text-center py-8 text-gray-500">Loading resources...</div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Learning Resources</h3>
        {isAdmin && (
          <button
            onClick={onManageClick}
            className="text-sm font-semibold text-primary hover:text-primary/80 uppercase tracking-wide"
          >
            Manage
          </button>
        )}
      </div>

      {/* Resources List */}
      {!stageResources || stageResources.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No resources assigned to this stage yet.</p>
          {isAdmin && (
            <button
              onClick={onManageClick}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Resources
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {stageResources.map((resource) => (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-gray-200 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Category Label */}
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    {resource.category}
                  </span>
                  
                  {/* Title */}
                  <h4 className="font-bold text-gray-900 mt-2 mb-1 group-hover:text-primary transition-colors">
                    {resource.title}
                  </h4>
                  
                  {/* Description */}
                  {resource.description && (
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {resource.description}
                    </p>
                  )}
                </div>
                
                {/* External Link Icon */}
                <ExternalLink className="w-5 h-5 text-gray-300 group-hover:text-primary flex-shrink-0 mt-1 transition-colors" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
