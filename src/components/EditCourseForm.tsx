
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { EditCourseStages } from "./EditCourseStages";
import { CourseCompanyJobFields } from "@/components/CourseCompanyJobFields";

interface Course {
  id: string;
  title: string;
  description: string | null;
  company: string | null;
  attached_jobs: string[] | null;
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
    company: course.company || "",
    attachedJobs: course.attached_jobs || [],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Update the course basic information
      const { error: courseError } = await supabase
        .from('courses')
        .update({
          title: formData.title,
          description: formData.description,
          company: formData.company,
          attached_jobs: formData.attachedJobs,
        })
        .eq('id', course.id);

      if (courseError) throw courseError;

      // Handle stage updates more carefully to preserve relationships
      const existingStageIds = stages
        .filter(stage => stage.id && stage.id !== '')
        .map(stage => stage.id);

      // Get current stages from database
      const { data: currentStages, error: fetchError } = await supabase
        .from('course_stages')
        .select('id')
        .eq('course_id', course.id);

      if (fetchError) throw fetchError;

      const currentStageIds = currentStages?.map(s => s.id) || [];

      // Delete stages that were removed (only those not in the new stages list)
      const stagesToDelete = currentStageIds.filter(id => !existingStageIds.includes(id));
      
      if (stagesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('course_stages')
          .delete()
          .in('id', stagesToDelete);

        if (deleteError) throw deleteError;
      }

      // Update existing stages and insert new ones
      for (let index = 0; index < stages.length; index++) {
        const stage = stages[index];
        
        if (stage.id && stage.id !== '') {
          // Update existing stage
          const { error: updateError } = await supabase
            .from('course_stages')
            .update({
              title: stage.title,
              description: stage.description,
              information: stage.information,
              stage_order: index + 1,
            })
            .eq('id', stage.id);

          if (updateError) throw updateError;
        } else {
          // Insert new stage
          const { error: insertError } = await supabase
            .from('course_stages')
            .insert({
              course_id: course.id,
              title: stage.title,
              description: stage.description,
              information: stage.information,
              stage_order: index + 1,
            });

          if (insertError) throw insertError;
        }
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

        <CourseCompanyJobFields
          company={formData.company}
          attachedJobs={formData.attachedJobs}
          onCompanyChange={(company) => setFormData({ ...formData, company })}
          onAttachedJobsChange={(attachedJobs) => setFormData({ ...formData, attachedJobs })}
        />
      </div>

      <EditCourseStages stages={stages} onStagesChange={setStages} />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Updating Course..." : "Update Course"}
      </Button>
    </form>
  );
};
