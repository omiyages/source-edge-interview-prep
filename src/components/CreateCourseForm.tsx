
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Minus } from "lucide-react";

interface CreateCourseFormProps {
  onSuccess: () => void;
}

interface CourseStage {
  title: string;
  description: string;
  information: string;
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
  const [stageCount, setStageCount] = useState(4);
  const [stages, setStages] = useState<CourseStage[]>([
    { title: "HR Screen", description: "Initial screening with HR team", information: "This stage focuses on cultural fit and basic qualifications. **Preparation tips:**\n\n• Research company values\n• Prepare STAR method examples\n• Review your resume thoroughly", order: 1 },
    { title: "Technical Assessment", description: "Coding challenges and technical questions", information: "Technical evaluation of your coding skills. **What to expect:**\n\n• Data structures and algorithms\n• System design questions\n• Live coding sessions", order: 2 },
    { title: "Cross Interview", description: "Cross-functional team interviews", information: "Meet with potential teammates and stakeholders. **Focus areas:**\n\n• Collaboration skills\n• Communication abilities\n• Problem-solving approach", order: 3 },
    { title: "Final Interview", description: "Final round with senior leadership", information: "Last step in the interview process. **Key points:**\n\n• Executive presence\n• Strategic thinking\n• Long-term vision alignment", order: 4 },
  ]);

  const updateStageCount = (newCount: number) => {
    if (newCount < 1) return;
    
    setStageCount(newCount);
    const currentStages = [...stages];
    
    if (newCount > stages.length) {
      // Add new stages
      for (let i = stages.length; i < newCount; i++) {
        currentStages.push({
          title: `Stage ${i + 1}`,
          description: "",
          information: "",
          order: i + 1
        });
      }
    } else if (newCount < stages.length) {
      // Remove excess stages
      currentStages.splice(newCount);
    }
    
    setStages(currentStages);
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

      // Create the stages with information field
      const stageInserts = stages.map(stage => ({
        course_id: course.id,
        title: stage.title,
        description: stage.description,
        information: stage.information,
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

      // Reset form
      setFormData({ title: "", description: "" });
      setStageCount(4);
      setStages([
        { title: "HR Screen", description: "Initial screening with HR team", information: "", order: 1 },
        { title: "Technical Assessment", description: "Coding challenges and technical questions", information: "", order: 2 },
        { title: "Cross Interview", description: "Cross-functional team interviews", information: "", order: 3 },
        { title: "Final Interview", description: "Final round with senior leadership", information: "", order: 4 },
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
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => updateStageCount(stageCount - 1)}
              disabled={stageCount <= 1}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium px-2">{stageCount} stages</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => updateStageCount(stageCount + 1)}
              disabled={stageCount >= 10}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {stages.map((stage, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Stage {stage.order}</CardTitle>
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
        {isSubmitting ? "Creating Course..." : "Create Course"}
      </Button>
    </form>
  );
};
