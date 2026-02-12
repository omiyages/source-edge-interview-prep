import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Resource } from "@/services/resourcesService";
import { Search, ExternalLink, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ManageStageResourcesTableProps {
  stageId: string;
  onSuccess: () => void;
}

export const ManageStageResourcesTable = ({ stageId, onSuccess }: ManageStageResourcesTableProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch all available resources
  const { data: allResources, isLoading: isLoadingResources } = useQuery({
    queryKey: ['all-resources'],
    queryFn: async () => {
      console.log('🔍 Fetching all resources for stage management...');
      const { data, error } = await supabase
        .from('resources')
        .select('id, title, description, url, category, created_at')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching resources:', error);
        throw error;
      }
      
      console.log('✅ Resources fetched successfully:', data?.length || 0, 'resources');
      return data as Resource[];
    },
  });

  // Fetch currently assigned resources
  const { data: currentResources, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ['current-stage-resources', stageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stage_resources')
        .select('resource_id')
        .eq('stage_id', stageId);
      
      if (error) throw error;
      return new Set(data.map(item => item.resource_id));
    },
  });

  // Initialize selected resources when current resources are loaded
  useEffect(() => {
    if (currentResources) {
      setSelectedResources(currentResources);
    }
  }, [currentResources]);

  // Filter resources based on search and category
  const filteredResources = (allResources || []).filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set((allResources || []).map(r => r.category))).sort();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // First, remove all existing resources for this stage
      const { error: deleteError } = await supabase
        .from('stage_resources')
        .delete()
        .eq('stage_id', stageId);

      if (deleteError) throw deleteError;

      // Then, add the selected resources
      if (selectedResources.size > 0) {
        const resourcesToInsert = Array.from(selectedResources).map(resourceId => ({
          stage_id: stageId,
          resource_id: resourceId,
        }));

        const { error: insertError } = await supabase
          .from('stage_resources')
          .insert(resourcesToInsert);

        if (insertError) throw insertError;
      }

      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['stage-resources-display', stageId] });
      queryClient.invalidateQueries({ queryKey: ['current-stage-resources', stageId] });

      toast({
        title: "Resources updated!",
        description: `Successfully assigned ${selectedResources.size} resources to this stage.`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error updating stage resources:', error);
      toast({
        title: "Error",
        description: "Failed to update resources. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleResource = (resourceId: string) => {
    const newSelected = new Set(selectedResources);
    if (newSelected.has(resourceId)) {
      newSelected.delete(resourceId);
    } else {
      newSelected.add(resourceId);
    }
    setSelectedResources(newSelected);
  };

  const selectAll = () => {
    setSelectedResources(new Set(filteredResources.map(r => r.id)));
  };

  const clearAll = () => {
    setSelectedResources(new Set());
  };


  if (isLoadingResources || isLoadingCurrent) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading resources...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Select Resources ({selectedResources.size} selected)</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All Visible
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear All
          </Button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search resources by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Resources Table */}
      <div className="border rounded-lg overflow-hidden">
        {filteredResources.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || selectedCategory !== "all" 
              ? "No resources match your search criteria." 
              : "No resources available."}
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    Select
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResources.map((resource) => (
                  <tr 
                    key={resource.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedResources.has(resource.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedResources.has(resource.id)}
                        onChange={() => toggleResource(resource.id)}
                        className="h-4 w-4 text-primary rounded focus:ring-primary"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {resource.title}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="secondary" className="text-xs">
                        {resource.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-600">
                        {resource.description}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {selectedResources.has(resource.id) ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                        {resource.url && (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-gray-600">
          Showing {filteredResources.length} of {allResources?.length || 0} resources
          {selectedResources.size > 0 && (
            <span className="ml-2 text-blue-600 font-medium">
              ({selectedResources.size} selected)
            </span>
          )}
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};
