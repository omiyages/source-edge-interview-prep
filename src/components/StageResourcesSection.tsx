
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useClerkSupabase } from "@/hooks/useClerkSupabase";
import { ExternalLink, Plus } from "lucide-react";

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
  const { user, hasClerkJwt, clerkClientReady, refreshClerkToken } = useAuth();
  const { client: supabase } = useClerkSupabase();
  const { data: stageResources, isLoading } = useQuery({
    queryKey: ['stage-resources-display', stageId],
    queryFn: async () => {
      if (!clerkClientReady || !hasClerkJwt) {
        await refreshClerkToken?.();
      }
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
    enabled: Boolean(stageId && user?.id && clerkClientReady && hasClerkJwt),
    staleTime: 30000, // Cache for 30 seconds
  });

  if (isLoading) {
    return (
      <div className="h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Learning Resources</h3>
        </div>
        <div className="text-center py-8 text-neutral-400">Loading resources...</div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">Learning Resources</h3>
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
          <p className="text-neutral-400 mb-4">No resources assigned to this stage yet.</p>
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
              className="block bg-neutral-900 border border-neutral-800 rounded-xl p-4 hover:shadow-md hover:border-neutral-700 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Category Label */}
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    {resource.category}
                  </span>
                  
                  {/* Title */}
                  <h4 className="font-bold text-foreground mt-2 mb-1 group-hover:text-primary transition-colors">
                    {resource.title}
                  </h4>
                  
                  {/* Description */}
                  {resource.description && (
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      {resource.description}
                    </p>
                  )}
                </div>
                
                {/* External Link Icon */}
                <ExternalLink className="w-5 h-5 text-neutral-600 group-hover:text-primary flex-shrink-0 mt-1 transition-colors" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
