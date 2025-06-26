
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

interface CreateCourseFormProps {
  onSuccess: () => void;
}

interface CourseStage {
  title: string;
  description: string;
  order: number;
}

export const CreateCourseForm = ({ onSuccess }: CreateCourseFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [stages, setStages] = useState<CourseStage[]>([
    { title: "HR Screen", description: "Initial screening with HR team", order: 1 },
    { title: "Technical Assessment", description: "Coding challenges and technical questions", order: 2 },
    { title: "Cross Interview", description: "Cross-functional team interviews", order: 3 },
    { title: "Final Interview", description: "Final round with senior leadership", order: 4 },
  ]);

  const addStage = () => {
    setStages([...stages, { title: "", description: "", order: stages.length + 1 }]);
  };

  const removeStage = (index: number) => {
    const updatedStages = stages.filter((_, i) => i !== index);
    // Reorder stages
    const reorderedStages = updatedStages.map((stage, i) => ({ ...stage, order: i + 1 }));
    setStages(reorderedStages);
  };

  const updateStage = (index: number, field: keyof CourseStage, value: string | number) => {
    const updatedStages = [...stages];
    updatedStages[index] = { ...updatedStages[index], [field]: value };
    setStages(updatedStages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create the course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: formData.title,
          description: formData.description,
          created_by: user?.id,
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // Create the stages
      const stageInserts = stages.map(stage => ({
        course_id: course.id,
        title: stage.title,
        description: stage.description,
        stage_order: stage.order,
      }));

      const { error: stagesError } = await supabase
        .from('course_stages')
        .insert(stageInserts);

      if (stagesError) throw stagesError;

      toast({
        title: "Course created!",
        description: "Your course has been created successfully with all stages.",
      });

      setFormData({ title: "", description: "" });
      setStages([
        { title: "HR Screen", description: "Initial screening with HR team", order: 1 },
        { title: "Technical Assessment", description: "Coding challenges and technical questions", order: 2 },
        { title: "Cross Interview", description: "Cross-functional team interviews", order: 3 },
        { title: "Final Interview", description: "Final round with senior leadership", order: 4 },
      ]);

      onSuccess();
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Course Title *</Label>
          <Input
            id="title"
            placeholder="e.g., Google Software Engineer Prep"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Course Description</Label>
          <Textarea
            id="description"
            placeholder="Brief description of what this course covers..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-lg font-semibold">Interview Stages</Label>
          <Button type="button" variant="outline" size="sm" onClick={addStage}>
            <Plus className="w-4 h-4 mr-2" />
            Add Stage
          </Button>
        </div>

        <div className="space-y-4">
          {stages.map((stage, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm">Stage {stage.order}</CardTitle>
                  {stages.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStage(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor={`stage-title-${index}`}>Stage Title *</Label>
                  <Input
                    id={`stage-title-${index}`}
                    placeholder="e.g., Technical Assessment"
                    value={stage.title}
                    onChange={(e) => updateStage(index, 'title', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`stage-description-${index}`}>Stage Description</Label>
                  <Textarea
                    id={`stage-description-${index}`}
                    placeholder="What happens in this stage..."
                    value={stage.description}
                    onChange={(e) => updateStage(index, 'description', e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating Course..." : "Create Course"}
      </Button>
    </form>
  );
};
