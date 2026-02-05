
import { useState, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, BookOpen, Search } from "lucide-react";
import { Resource } from "@/services/resourcesService";

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
          <div className="flex gap-4">
            <div className="h-10 bg-muted rounded w-64 animate-pulse"></div>
            <div className="h-10 bg-muted rounded w-48 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg p-4 border border-border animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-muted rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      {/* Header with title and filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-foreground">
          Learning Resources ({resources.length})
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredResources.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No resources found matching your filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {filteredResources.slice(0, 6).map((resource) => (
              <div 
                key={resource.id} 
                className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-border"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-foreground">{resource.title}</h3>
                    {resource.description && (
                      <p className="text-muted-foreground text-sm mb-3">{resource.description}</p>
                    )}
                    <Badge variant="secondary">{resource.category}</Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(resource.url, '_blank')}
                    className="shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {resources.length > 6 && (
            <div className="text-center">
              <Button 
                variant="ghost"
                onClick={() => navigate('/resources')}
                className="text-primary hover:text-primary/80"
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
