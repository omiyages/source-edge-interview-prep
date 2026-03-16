
import { Skeleton } from "@/components/ui/skeleton";

export const ResourceSkeletonCard = () => {
  return (
    <div className="bg-neutral-900 rounded-lg shadow-md p-6 hover-purple-lift">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-4" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
};
