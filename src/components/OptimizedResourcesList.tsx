
import { memo, useMemo } from "react";
import { ResourceCard } from "./ResourceCard";
import { ResourceSkeletonCard } from "./ResourceSkeletonCard";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string;
  category: string;
  created_at: string;
}

interface OptimizedResourcesListProps {
  resources: Resource[];
  loading: boolean;
  isAdmin: boolean;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resourceId: string) => void;
  currentPage?: number;
  itemsPerPage?: number;
}

const SKELETON_COUNT = 6;

export const OptimizedResourcesList = memo(({ 
  resources, 
  loading, 
  isAdmin, 
  onEdit, 
  onDelete,
  currentPage = 1,
  itemsPerPage = 9
}: OptimizedResourcesListProps) => {
  const paginatedResources = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return resources.slice(startIndex, endIndex);
  }, [resources, currentPage, itemsPerPage]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <ResourceSkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (paginatedResources.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No resources found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
      {paginatedResources.map((resource) => (
        <ResourceCard
          key={resource.id}
          resource={resource}
          onEdit={isAdmin ? onEdit : undefined}
          onDelete={isAdmin ? onDelete : undefined}
        />
      ))}
    </div>
  );
});

OptimizedResourcesList.displayName = "OptimizedResourcesList";
