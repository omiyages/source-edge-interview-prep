import * as React from "react";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  rounded?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  lines = 3,
  rounded = "rounded-md",
}) => {
  return (
    <div className={cn("animate-pulse", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-4 bg-muted mb-3",
            rounded,
            index === lines - 1 ? "w-2/3" : "w-full"
          )}
        />
      ))}
    </div>
  );
};

export default LoadingSkeleton;



