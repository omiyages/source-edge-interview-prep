import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  ExternalLink,
  Home, 
  Video, 
  Calculator, 
  FileText, 
  Code, 
  Briefcase,
  GraduationCap,
  Users,
  Globe,
  Lightbulb,
  Target,
  TrendingUp,
  BookOpen
} from "lucide-react";
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

// Icon and color mapping based on category/title keywords
const getIconAndColor = (category: string, title: string) => {
  const lowerCategory = category.toLowerCase();
  const lowerTitle = title.toLowerCase();
  
  // Check title keywords first for more specific matches
  if (lowerTitle.includes('rental') || lowerTitle.includes('property') || lowerTitle.includes('housing')) {
    return { icon: Home, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' };
  }
  if (lowerTitle.includes('cost of living') || lowerTitle.includes('living index')) {
    return { icon: Video, bgColor: 'bg-emerald-100', iconColor: 'text-emerald-600' };
  }
  if (lowerTitle.includes('salary') || lowerTitle.includes('calculator') || lowerTitle.includes('tax')) {
    return { icon: Calculator, bgColor: 'bg-amber-100', iconColor: 'text-amber-600' };
  }
  if (lowerTitle.includes('visa') || lowerTitle.includes('immigration')) {
    return { icon: FileText, bgColor: 'bg-purple-100', iconColor: 'text-purple-600' };
  }
  
  // Fall back to category-based icons
  if (lowerCategory.includes('finance') || lowerCategory.includes('money')) {
    return { icon: TrendingUp, bgColor: 'bg-emerald-100', iconColor: 'text-emerald-600' };
  }
  if (lowerCategory.includes('code') || lowerCategory.includes('programming') || lowerCategory.includes('technical')) {
    return { icon: Code, bgColor: 'bg-indigo-100', iconColor: 'text-indigo-600' };
  }
  if (lowerCategory.includes('career') || lowerCategory.includes('job')) {
    return { icon: Briefcase, bgColor: 'bg-orange-100', iconColor: 'text-orange-600' };
  }
  if (lowerCategory.includes('learning') || lowerCategory.includes('education')) {
    return { icon: GraduationCap, bgColor: 'bg-cyan-100', iconColor: 'text-cyan-600' };
  }
  if (lowerCategory.includes('community') || lowerCategory.includes('network')) {
    return { icon: Users, bgColor: 'bg-pink-100', iconColor: 'text-pink-600' };
  }
  if (lowerCategory.includes('relocation') || lowerCategory.includes('expat')) {
    return { icon: Globe, bgColor: 'bg-teal-100', iconColor: 'text-teal-600' };
  }
  if (lowerCategory.includes('guide') || lowerCategory.includes('tutorial')) {
    return { icon: Lightbulb, bgColor: 'bg-yellow-100', iconColor: 'text-yellow-600' };
  }
  if (lowerCategory.includes('tool')) {
    return { icon: Target, bgColor: 'bg-red-100', iconColor: 'text-red-600' };
  }
  
  // Default
  return { icon: BookOpen, bgColor: 'bg-slate-100', iconColor: 'text-slate-600' };
};

// Get tags from category
const getTags = (category: string): string[] => {
  const tags = category.split(/[,\/&]/).map(t => t.trim().toUpperCase()).filter(Boolean);
  return tags.length > 0 ? tags : [category.toUpperCase()];
};

export const ResourceCard = ({ resource, onEdit, onDelete }: ResourceCardProps) => {
  const { isAdmin } = useAuth();
  const { icon: IconComponent, bgColor, iconColor } = getIconAndColor(resource.category, resource.title);
  const tags = getTags(resource.category);

  return (
    <div 
      className="bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 flex flex-col h-full group cursor-pointer"
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
                  className="h-8 w-8 p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
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
          <ExternalLink className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
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
            className="bg-slate-100 text-slate-600 hover:bg-slate-100 text-xs font-medium px-2.5 py-1 rounded"
          >
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
};
