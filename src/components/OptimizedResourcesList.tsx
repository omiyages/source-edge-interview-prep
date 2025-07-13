
import { memo, useMemo, useEffect } from "react";
import { ResourceCard } from "./ResourceCard";
import { ResourceSkeletonCard } from "./ResourceSkeletonCard";
import { LoadingSpinner } from "./ui/loading-spinner";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import ErrorBoundary from "./ui/error-boundary";
import { Resource } from "@/services/resourcesService";

interface OptimizedResourcesListProps {
  resources: Resource[];
  loading?: boolean;
  isAdmin?: boolean;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resourceId: string) => void;
  currentPage?: number;
  itemsPerPage?: number;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  useInfiniteScroll?: boolean;
  // New props for selection functionality
  selectedResources?: Set<string>;
  onToggleResource?: (resourceId: string) => void;
}

const SKELETON_COUNT = 6;

export const OptimizedResourcesList = memo(({ 
  resources, 
  loading = false, 
  isAdmin = false, 
  onEdit, 
  onDelete,
  currentPage = 1,
  itemsPerPage = 9,
  hasNextPage = false,
  onLoadMore,
  useInfiniteScroll: enableInfiniteScroll = false,
  selectedResources,
  onToggleResource
}: OptimizedResourcesListProps) => {
  const { isFetching, setTarget, resetFetching } = useInfiniteScroll({
    hasNextPage,
    isLoading: loading,
  });

  useEffect(() => {
    if (isFetching && onLoadMore) {
      onLoadMore();
      resetFetching();
    }
  }, [isFetching, onLoadMore, resetFetching]);

  const displayResources = useMemo(() => {
    if (enableInfiniteScroll) {
      return resources;
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return resources.slice(startIndex, endIndex);
  }, [resources, currentPage, itemsPerPage, enableInfiniteScroll]);

  if (loading && displayResources.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-token-lg pb-token-3xl">
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <ResourceSkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (displayResources.length === 0) {
    return (
      <div className="text-center py-token-4xl animate-fade-in">
        <p className="text-muted-foreground text-token-lg">No resources found.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-token-lg pb-token-3xl">
        {displayResources.map((resource, index) => (
          <div 
            key={resource.id}
            style={{ animationDelay: `${index * 50}ms` }}
            className="animate-slide-up"
          >
            {selectedResources && onToggleResource ? (
              <div 
                className={`cursor-pointer border-2 rounded-lg transition-all ${
                  selectedResources.has(resource.id) 
                    ? 'border-primary bg-primary/5' 
                    : 'border-transparent hover:border-gray-200'
                }`}
                onClick={() => onToggleResource(resource.id)}
              >
                <div className="p-2">
                  <ResourceCard
                    resource={resource}
                    onEdit={isAdmin ? onEdit : undefined}
                    onDelete={isAdmin ? onDelete : undefined}
                  />
                  <div className="mt-2 flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedResources.has(resource.id)}
                      onChange={() => onToggleResource(resource.id)}
                      className="h-4 w-4 text-primary"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <ResourceCard
                resource={resource}
                onEdit={isAdmin ? onEdit : undefined}
                onDelete={isAdmin ? onDelete : undefined}
              />
            )}
          </div>
        ))}
      </div>
      
      {enableInfiniteScroll && hasNextPage && (
        <div ref={setTarget} className="flex justify-center py-token-xl">
          {loading && <LoadingSpinner text="Loading more resources..." />}
        </div>
      )}
      
      {loading && displayResources.length > 0 && !enableInfiniteScroll && (
        <div className="flex justify-center py-token-lg">
          <LoadingSpinner text="Loading..." />
        </div>
      )}
    </ErrorBoundary>
  );
});

OptimizedResourcesList.displayName = "OptimizedResourcesList";
