
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResourceCard } from "@/components/ResourceCard";
import { CreateResourceForm } from "@/components/CreateResourceForm";
import { EditResourceForm } from "@/components/EditResourceForm";
import { Plus, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  const categories = [
    "Interview Prep",
    "Technical Skills", 
    "Career Development",
    "Coding Practice",
    "System Design",
    "Behavioral Interview",
    "Other"
  ];

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
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-lg">Loading resources...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Useful Resources</h1>
        <p className="text-lg text-muted-foreground">
          Curated collection of helpful resources for interview preparation and career development.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isAdmin && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Resource</DialogTitle>
              </DialogHeader>
              <CreateResourceForm onSuccess={handleCreateSuccess} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            onEdit={isAdmin ? handleEdit : undefined}
            onDelete={isAdmin ? handleDelete : undefined}
          />
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            {selectedCategory === "all" 
              ? "No resources available yet." 
              : `No resources found in the "${selectedCategory}" category.`
            }
          </p>
        </div>
      )}

      {editingResource && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
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
  );
};

export default Resources;
