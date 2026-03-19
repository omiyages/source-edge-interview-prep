import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreVertical, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getIconAndColor, getTags } from "@/utils/resourceIcons";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string;
  category: string;
  created_at: string;
}

interface ResourceCardProps {
  resource: Resource;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resourceId: string) => void;
}

export const ResourceCard = ({ resource, onEdit, onDelete }: ResourceCardProps) => {
  const { isAdmin } = useAuth();
  const { icon: IconComponent, bgColor, iconColor } = getIconAndColor(resource.category, resource.title);
  const tags = getTags(resource.category);

  return (
    <div 
      className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 hover:border-neutral-700 hover:shadow-lg transition-all duration-200 flex flex-col h-full group cursor-pointer"
      onClick={() => window.open(resource.url, '_blank')}
    >
      {/* Icon and Actions Row */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center`}>
          <IconComponent className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className="flex items-center gap-1">
          {isAdmin && (onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(resource); }}>
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); onDelete(resource.id); }}
                    className="text-red-600"
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <ExternalLink className="w-5 h-5 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
        {resource.title}
      </h3>

      {/* Description */}
      {resource.description && (
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
          {resource.description}
        </p>
      )}
      
      {/* Tags */}
      <div className="flex flex-wrap gap-2 mt-auto">
        {tags.slice(0, 2).map((tag, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="bg-neutral-800 text-neutral-400 hover:bg-neutral-800 text-xs font-medium px-2.5 py-1 rounded"
          >
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
};
