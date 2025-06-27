
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface CreateResourceFormProps {
  onSuccess: () => void;
}

export const CreateResourceForm = ({ onSuccess }: CreateResourceFormProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    category: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('resources')
        .insert({
          title: formData.title,
          description: formData.description,
          url: formData.url,
          category: formData.category,
          created_by: profile?.id,
        });

      if (error) throw error;

      toast({
        title: "Resource created!",
        description: "The resource has been added successfully.",
      });

      setFormData({ title: "", description: "", url: "", category: "" });
      onSuccess();
    } catch (error) {
      console.error('Error creating resource:', error);
      toast({
        title: "Error",
        description: "Failed to create resource. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Resource"}
      </Button>
    </form>
  );
};
