
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Wand2, Workflow } from "lucide-react";
import { AutoGenerateCourseForm } from "./AutoGenerateCourseForm";
import { CreateCourseWorkflow } from "./CreateCourseWorkflow";

interface CreateCourseFormProps {
  onSuccess: () => void;
}

export const CreateCourseForm = ({ onSuccess }: CreateCourseFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('courses')
        .insert({
          title: formData.title,
          description: formData.description,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Course Created",
        description: "Your course has been created successfully. You can edit it to add stages and content.",
      });

      setFormData({ title: "", description: "" });
      onSuccess();
    } catch (error: any) {
      console.error('Error creating course:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create course",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Tabs defaultValue="workflow" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="workflow" className="flex items-center gap-2">
          <Workflow className="w-4 h-4" />
          Full Setup
        </TabsTrigger>
        <TabsTrigger value="quick" className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Quick Create
        </TabsTrigger>
        <TabsTrigger value="ai" className="flex items-center gap-2">
          <Wand2 className="w-4 h-4" />
          AI Generation
        </TabsTrigger>
      </TabsList>

      <TabsContent value="workflow" className="mt-6">
        <CreateCourseWorkflow onSuccess={onSuccess} />
      </TabsContent>

      <TabsContent value="quick" className="mt-6">
        <form onSubmit={handleQuickSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Course Title *
              </label>
              <Input
                id="title"
                placeholder="Enter course title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Course Description
              </label>
              <Textarea 
                id="description"
                placeholder="Enter course description" 
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating..." : "Create Course (Add Content Later)"}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="ai" className="mt-6">
        <AutoGenerateCourseForm onSuccess={onSuccess} />
      </TabsContent>
    </Tabs>
  );
};
