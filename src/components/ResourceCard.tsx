
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
    <Card className="card-interactive h-full animate-slide-up shadow-token-sm hover:shadow-token-lg">
      <CardHeader className="pb-token-md">
        <div className="flex items-start justify-between gap-token-sm">
          <CardTitle className="text-token-lg line-clamp-2 font-semibold text-card-foreground">
            {resource.title}
          </CardTitle>
          <Badge 
            variant="secondary" 
            className="ml-token-sm shrink-0 bg-primary/10 text-primary border-primary/20 hover-scale"
          >
            {resource.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-token-md">
        {resource.description && (
          <p className="text-token-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {resource.description}
          </p>
        )}
        
        <div className="flex items-center justify-between pt-token-sm">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(resource.url, '_blank')}
            className="btn-touch hover-scale flex items-center gap-token-sm border-primary/20 hover:bg-primary/5"
          >
            <ExternalLink className="h-4 w-4" />
            Visit Resource
          </Button>

          {isAdmin && (
            <div className="flex gap-token-xs">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit?.(resource)}
                className="btn-touch hover-scale text-primary hover:bg-primary/10"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete?.(resource.id)}
                className="btn-touch hover-scale text-destructive hover:bg-destructive/10"
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
