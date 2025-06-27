
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { Resource } from "@/services/resourcesService";

interface ResourcesPreviewProps {
  resources: Resource[];
  loading: boolean;
}

export const ResourcesPreview = ({ resources, loading }: ResourcesPreviewProps) => {
  return (
    <div className="mb-12 bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Useful Resources</h2>
        <Link to="/resources">
          <Button variant="ghost" className="flex items-center gap-2">
            View All <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      <p className="text-gray-600 mb-4">
        Check out our curated collection of helpful resources for interview preparation and career development.
      </p>
      
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading resources...</p>
        </div>
      ) : resources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {resources.slice(0, 10).map((resource) => (
            <div key={resource.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-sm line-clamp-2">{resource.title}</h3>
                <Badge variant="secondary" className="ml-2 shrink-0 text-xs">
                  {resource.category}
                </Badge>
              </div>
              {resource.description && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {resource.description}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(resource.url, '_blank')}
                className="flex items-center gap-2 text-xs"
              >
                <ExternalLink className="h-3 w-3" />
                Visit
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Badge variant="secondary">Interview Prep</Badge>
          <Badge variant="secondary">Technical Skills</Badge>
          <Badge variant="secondary">System Design</Badge>
          <Badge variant="secondary">Career Development</Badge>
        </div>
      )}
    </div>
  );
};
