import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm text-muted-foreground", className)}>
      <ol className="flex items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const content = item.href && !isLast ? (
            <Link to={item.href} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className={cn(isLast && "text-foreground font-medium")}>{item.label}</span>
          );

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {content}
              {!isLast && <ChevronRight className="w-4 h-4 opacity-60" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;



