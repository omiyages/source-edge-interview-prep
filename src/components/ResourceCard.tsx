import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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

  // Simple tag mapping - show category as primary tag
  // In a real implementation, you might want to store tags separately in the database
  const getTags = (category: string) => {
    const tags: string[] = [];
    
    // Add category as primary tag
    if (category === 'System Design') {
      tags.push('Architecture');
    } else if (category === 'Behavioral' || category === 'Behavioral Interview') {
      tags.push('Soft Skills');
    } else if (category === 'Algorithms' || category === 'Coding Practice') {
      tags.push('Practice');
    } else if (category === 'Frontend') {
      tags.push('Frontend');
    } else if (category === 'Backend') {
      tags.push('Backend');
    } else {
      // Use category name as tag, but clean it up
      tags.push(category);
    }
    
    return tags;
  };

  const tags = getTags(resource.category);

  return (
    <Card className="bg-white border border-border shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
      <CardContent className="p-6 flex flex-col h-full">
        {/* Header with ellipsis menu */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground mb-3 line-clamp-2">
              {resource.title}
            </h3>
          </div>
          {isAdmin && (onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(resource)}>
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(resource.id)}
                    className="text-red-600"
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Description */}
        {resource.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
            {resource.description}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="bg-gray-100 text-gray-700 hover:bg-gray-100 text-xs"
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Visit Button */}
        <div className="mt-auto pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(resource.url, '_blank')}
            className="w-full bg-white hover:bg-gray-50"
          >
            Visit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
