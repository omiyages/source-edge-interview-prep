
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Book } from "lucide-react";
import { Link } from "react-router-dom";
import { Resource } from "@/services/resourcesService";

interface ResourcesPreviewProps {
  resources: Resource[];
  loading: boolean;
}

export const ResourcesPreview = ({ resources, loading }: ResourcesPreviewProps) => {
  if (loading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="w-5 h-5" />
            Learning Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Book className="w-5 h-5" />
            Learning Resources
          </CardTitle>
          <Link to="/resources">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {resources.length === 0 ? (
          <p className="text-gray-500">No resources available yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {resources.slice(0, 3).map((resource) => (
              <div key={resource.id} className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">{resource.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {resource.category}
                  </span>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
