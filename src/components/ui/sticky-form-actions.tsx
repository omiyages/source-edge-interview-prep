import * as React from "react";
import { cn } from "@/lib/utils";

interface StickyFormActionsProps {
  children: React.ReactNode;
  className?: string;
}

export const StickyFormActions: React.FC<StickyFormActionsProps> = ({ children, className }) => {
  return (
    <div className={cn(
      "sticky bottom-0 left-0 right-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "border-t px-4 py-3 flex items-center justify-end gap-2",
      className
    )}>
      {children}
    </div>
  );
};

export default StickyFormActions;


