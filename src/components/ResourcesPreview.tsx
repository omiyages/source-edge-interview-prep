
import { useState, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, BookOpen, Search, Filter } from "lucide-react";
import { Resource } from "@/services/resourcesService";
import { getIconAndColor, getTags } from "@/utils/resourceIcons";

interface ResourcesPreviewProps {
  resources: Resource[];
  loading: boolean;
}

const ResourcesPreview = memo(({ resources, loading }: ResourcesPreviewProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const navigate = useNavigate();

  // Get unique categories - memoized
  const uniqueCategories = useMemo(() => 
    [...new Set(resources.map(r => r.category))].sort(), [resources]);

  // Filter resources - memoized
  const filteredResources = useMemo(() => {
    return resources.filter(resource => {
      const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (resource.description && resource.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [resources, searchTerm, selectedCategory]);

  if (loading) {
    return (
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 gap-4">
          <div>
            <div className="h-8 bg-neutral-800 rounded w-48 animate-pulse mb-2"></div>
            <div className="h-4 bg-neutral-800 rounded w-72 animate-pulse"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 bg-neutral-800 rounded w-48 animate-pulse"></div>
            <div className="h-10 bg-neutral-800 rounded w-20 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-neutral-900 rounded-xl p-6 border border-border animate-pulse">
              <div className="w-12 h-12 bg-neutral-800 rounded-xl mb-4"></div>
              <div className="h-5 bg-neutral-800 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-neutral-800 rounded w-full mb-2"></div>
              <div className="h-4 bg-neutral-800 rounded w-2/3 mb-4"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-neutral-800 rounded w-16"></div>
                <div className="h-6 bg-neutral-800 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      {/* Header with title and filters */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
            Learning Resources
          </h2>
          <p className="text-muted-foreground">
            Hand-picked guides to support you through every stage of the interview process, from interviewing to your first day.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -tranneutral-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-48 bg-neutral-900"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-auto min-w-[80px] bg-neutral-900">
              <div className="flex items-center gap-2">
                <span>{selectedCategory === 'all' ? 'All' : selectedCategory}</span>
                <Filter className="h-3 w-3 text-muted-foreground" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {uniqueCategories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredResources.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No resources found matching your filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {filteredResources.slice(0, 3).map((resource) => {
              const { icon: IconComponent, bgColor, iconColor } = getIconAndColor(resource.category, resource.title);
              const tags = getTags(resource.category);
              
              return (
                <div 
                  key={resource.id} 
                  className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 hover:border-neutral-700 hover:shadow-lg transition-all duration-200 flex flex-col group cursor-pointer"
                  onClick={() => window.open(resource.url, '_blank')}
                >
                  {/* Icon and External Link */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center`}>
                      <IconComponent className={`w-6 h-6 ${iconColor}`} />
                    </div>
                    <ExternalLink className="w-5 h-5 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
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
            })}
          </div>
            
          {resources.length > 3 && (
            <div className="text-center">
              <Button 
                variant="link"
                onClick={() => navigate('/resources')}
                className="text-primary hover:text-primary/80 font-medium"
              >
                View All Resources ({resources.length}) →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
});

ResourcesPreview.displayName = 'ResourcesPreview';

export { ResourcesPreview };
