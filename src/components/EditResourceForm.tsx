
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string;
  category: string;
}

interface EditResourceFormProps {
  resource: Resource;
  onSuccess: () => void;
}

export const EditResourceForm = ({ resource, onSuccess }: EditResourceFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: resource.title,
    description: resource.description || "",
    url: resource.url,
    category: resource.category,
  });

  const updateResourceMutation = useMutation({
    mutationFn: async (resourceData: typeof formData) => {
      const { error } = await supabase
        .from('resources')
        .update({
          title: resourceData.title,
          description: resourceData.description || null,
          url: resourceData.url,
          category: resourceData.category,
          updated_at: new Date().toISOString(),
        })
        .eq('id', resource.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast({
        title: "Resource updated!",
        description: "The resource has been updated successfully.",
      });
      onSuccess();
    },
    onError: (error) => {
      console.error('Error updating resource:', error);
      toast({
        title: "Error",
        description: "Failed to update resource. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateResourceMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="Resource title..."
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">URL *</Label>
        <Input
          id="url"
          type="url"
          placeholder="https://example.com"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Interview Prep">Interview Prep</SelectItem>
            <SelectItem value="Technical Skills">Technical Skills</SelectItem>
            <SelectItem value="Career Development">Career Development</SelectItem>
            <SelectItem value="Coding Practice">Coding Practice</SelectItem>
            <SelectItem value="System Design">System Design</SelectItem>
            <SelectItem value="Behavioral Interview">Behavioral Interview</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Brief description of the resource..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={updateResourceMutation.isPending}>
        {updateResourceMutation.isPending ? "Updating..." : "Update Resource"}
      </Button>
    </form>
  );
};
