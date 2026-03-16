// ABOUTME: Teal notification badge component for displaying counts
// ABOUTME: Positioned at top-right of parent element using absolute positioning

import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  className?: string;
  maxCount?: number;
}

export const NotificationBadge = ({ 
  count, 
  className, 
  maxCount = 99 
}: NotificationBadgeProps) => {
  if (count <= 0) return null;
  
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  
  return (
    <div 
      className={cn(
        "absolute -top-2 -right-2 flex items-center justify-center",
        "min-w-5 h-5 px-1.5 py-0.5",
        "bg-teal-500 text-white text-xs font-medium rounded-full",
        "ring-2 ring-background",
        "animate-in fade-in-0 zoom-in-75 duration-200",
        className
      )}
    >
      {displayCount}
    </div>
  );
};