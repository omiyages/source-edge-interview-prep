
// ABOUTME: Modern card component for displaying resource information with LMS-inspired design
// ABOUTME: Features clean layout and admin controls with enhanced visual styling

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Edit, Trash2, FileText, Globe } from "lucide-react";
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

  const getCategoryColor = (category: string) => {
    const colors = {
      'Documentation': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
      'Tutorial': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
      'Video': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
      'Article': 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
      'Tool': 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
  };

  return (
    <Card className="group relative bg-card border border-border shadow-sm hover:shadow-xl transition-all duration-300 h-full overflow-hidden hover-lift">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-card via-muted/30 to-primary/5 pointer-events-none" />
      
      {/* Category indicator bar at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />

      <CardHeader className="relative pb-4 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-foreground line-clamp-2 mb-3 leading-tight">
              {resource.title}
            </CardTitle>
            <Badge 
              variant="secondary" 
              className={`${getCategoryColor(resource.category)} font-medium px-2 py-1 text-xs inline-flex items-center gap-1`}
            >
              <FileText className="w-3 h-3" />
              {resource.category}
            </Badge>
          </div>
          
          {isAdmin && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit?.(resource)}
                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete?.(resource.id)}
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative space-y-5 flex-1 flex flex-col px-6 pb-6">
        {resource.description && (
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed flex-1">
            {resource.description}
          </p>
        )}
        
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            Added {new Date(resource.created_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(resource.url, '_blank')}
            className="hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 font-medium hover-scale"
          >
            <Globe className="h-4 w-4 mr-1.5" />
            Visit
          </Button>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary/60 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </CardContent>
    </Card>
  );
};
