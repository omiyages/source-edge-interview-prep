
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string | null;
}

interface CourseStage {
  id: string;
  title: string;
  description: string;
  information: string;
  stage_order: number;
}

interface EditCourseFormProps {
  course: Course;
  onSuccess: () => void;
}

export const EditCourseForm = ({ course, onSuccess }: EditCourseFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: course.title,
    description: course.description || "",
  });
  const [stages, setStages] = useState<CourseStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStages();
  }, [course.id]);

  const fetchStages = async () => {
    try {
      const { data, error } = await supabase
        .from('course_stages')
        .select('*')
        .eq('course_id', course.id)
        .order('stage_order');
      
      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      console.error('Error fetching stages:', error);
      toast({
        title: "Error",
        description: "Failed to load course stages.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStage = (index: number, field: keyof CourseStage, value: string | number) => {
    const updatedStages = [...stages];
    updatedStages[index] = { ...updatedStages[index], [field]: value };
    setStages(updatedStages);
  };

  const addStage = () => {
    const newStage: CourseStage = {
      id: '', // Will be generated on save
      title: `Stage ${stages.length + 1}`,
      description: "",
      information: "",
      stage_order: stages.length + 1
    };
    setStages([...stages, newStage]);
  };

  const removeStage = (index: number) => {
    const updatedStages = stages.filter((_, i) => i !== index);
    // Update stage orders
    updatedStages.forEach((stage, i) => {
      stage.stage_order = i + 1;
    });
    setStages(updatedStages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Update the course
      const { error: courseError } = await supabase
        .from('courses')
        .update({
          title: formData.title,
          description: formData.description,
        })
        .eq('id', course.id);

      if (courseError) throw courseError;

      // Delete existing stages
      const { error: deleteError } = await supabase
        .from('course_stages')
        .delete()
        .eq('course_id', course.id);

      if (deleteError) throw deleteError;

      // Insert updated stages
      if (stages.length > 0) {
        const stageInserts = stages.map((stage, index) => ({
          course_id: course.id,
          title: stage.title,
          description: stage.description,
          information: stage.information,
          stage_order: index + 1,
        }));

        const { error: stagesError } = await supabase
          .from('course_stages')
          .insert(stageInserts);

        if (stagesError) throw stagesError;
      }

      toast({
        title: "Course updated!",
        description: "Your course has been updated successfully.",
      });

      onSuccess();
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: "Error",
        description: "Failed to update course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading course details...</div>;
  }

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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addStage}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Stage
          </Button>
        </div>

        <div className="space-y-4">
          {stages.map((stage, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm">Stage {index + 1}</CardTitle>
                  {stages.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeStage(index)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor={`stage-description-${index}`}>Short Description</Label>
                    <Input
                      id={`stage-description-${index}`}
                      placeholder="Brief description..."
                      value={stage.description}
                      onChange={(e) => updateStage(index, 'description', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`stage-information-${index}`}>
                    Detailed Information 
                    <span className="text-xs text-gray-500 ml-2">
                      (Use **text** for bold, line breaks for formatting)
                    </span>
                  </Label>
                  <Textarea
                    id={`stage-information-${index}`}
                    placeholder="Detailed information about this stage, preparation tips, what to expect, etc. Use **bold text** for emphasis..."
                    value={stage.information}
                    onChange={(e) => updateStage(index, 'information', e.target.value)}
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Updating Course..." : "Update Course"}
      </Button>
    </form>
  );
};
