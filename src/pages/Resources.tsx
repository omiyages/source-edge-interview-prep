
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

interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string;
  category: string;
  created_at: string;
}

const Resources = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data || []);
      setFilteredResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: "Error",
        description: "Failed to load resources.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredResources(resources);
    } else {
      setFilteredResources(resources.filter(resource => resource.category === selectedCategory));
    }
  }, [selectedCategory, resources]);

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
    return <ResourcesLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <ResourcesHeader />

        <ResourcesFilters
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          isAdmin={isAdmin}
          createDialogOpen={createDialogOpen}
          onCreateDialogOpenChange={setCreateDialogOpen}
          onCreateSuccess={handleCreateSuccess}
        />

        {filteredResources.length > 0 ? (
          <ResourcesList
            resources={filteredResources}
            isAdmin={isAdmin}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <ResourcesEmpty selectedCategory={selectedCategory} />
        )}

        {editingResource && (
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-md bg-white">
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
    </div>
  );
};

export default Resources;
