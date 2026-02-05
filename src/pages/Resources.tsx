import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditResourceForm } from "@/components/EditResourceForm";
import { useToast } from "@/hooks/use-toast";
import { ResourcesHeader } from "@/components/ResourcesHeader";
import { ResourcesFilters } from "@/components/ResourcesFilters";
import { ResourcesList } from "@/components/ResourcesList";
import { ResourcesEmpty } from "@/components/ResourcesEmpty";
import { ResourcesLoading } from "@/components/ResourcesLoading";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { FolderX } from "lucide-react";
import { NavigationHeader } from "@/components/NavigationHeader";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string;
  category: string;
  created_at: string;
}

const Resources = () => {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const fetchResources = async () => {
    try {
      console.log('🔄 Fetching resources...');
      
      // Check if user is authenticated before making requests
      if (!user) {
        console.log('❌ No authenticated user found');
        toast({
          title: "Authentication Required",
          description: "Please log in to access resources.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('resources')
        .select('id, title, description, url, category, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching resources:', error);
        throw error;
      }

      console.log('✅ Resources fetched successfully:', data?.length || 0);
      setResources(data || []);
      setFilteredResources(data || []);
    } catch (error) {
      console.error('❌ Error fetching resources:', error);
      toast({
        title: "Error",
        description: "Failed to load resources. Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch resources if user is available
    if (user) {
      fetchResources();
    }
  }, [user]);

  // Initialize category from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, []);

  // Persist category to URL without navigation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (selectedCategory && selectedCategory !== 'all') {
      params.set('category', selectedCategory);
    } else {
      params.delete('category');
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [selectedCategory]);

  useEffect(() => {
    let filtered = resources;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(resource => resource.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(resource => 
        resource.title.toLowerCase().includes(searchLower) ||
        resource.description?.toLowerCase().includes(searchLower) ||
        resource.category.toLowerCase().includes(searchLower)
      );
    }

    setFilteredResources(filtered);
  }, [selectedCategory, searchTerm, resources]);

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setEditDialogOpen(true);
  };

  const handleDelete = async (resourceId: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: "Resource deleted",
        description: "The resource has been removed successfully.",
      });

      fetchResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: "Error",
        description: "Failed to delete resource. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    fetchResources();
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setEditingResource(null);
    fetchResources();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8 flex-1">
        <ResourcesHeader 
            isAdmin={isAdmin}
            createDialogOpen={createDialogOpen}
            onCreateDialogOpenChange={setCreateDialogOpen}
            onCreateSuccess={handleCreateSuccess}
          />
        <ResourcesFilters
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          resources={resources}
        />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 rounded-lg border">
                <LoadingSkeleton lines={1} className="mb-2" />
                <LoadingSkeleton lines={3} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8 flex-1">
        <ResourcesHeader 
          isAdmin={isAdmin}
          createDialogOpen={createDialogOpen}
          onCreateDialogOpenChange={setCreateDialogOpen}
          onCreateSuccess={handleCreateSuccess}
        />
        <ResourcesFilters
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          resources={resources}
        />

        {filteredResources.length > 0 ? (
          <ResourcesList
            resources={filteredResources}
            isAdmin={isAdmin}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <EmptyState
            title={selectedCategory === 'all' ? 'No resources yet' : 'No resources in this category'}
            description={selectedCategory === 'all' ? 'Create the first resource to kick things off.' : 'Try a different category or add a new resource.'}
            icon={<FolderX className="w-16 h-16 mx-auto text-gray-400" />}
          />
        )}

        {editingResource && (
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-md bg-background">
              <DialogHeader>
                <DialogTitle>Edit Resource</DialogTitle>
              </DialogHeader>
              <EditResourceForm 
                resource={editingResource} 
                onSuccess={handleEditSuccess} 
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-border/30 mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 Source Edge Database. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Resources;
