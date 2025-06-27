
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Edit, Trash2 } from "lucide-react";
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

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>
          <Badge variant="secondary" className="ml-2 shrink-0">
            {resource.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {resource.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {resource.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(resource.url, '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Visit Resource
          </Button>

          {isAdmin && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit?.(resource)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete?.(resource.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
