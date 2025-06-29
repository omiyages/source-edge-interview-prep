
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CourseData {
  title: string;
  description: string;
}

interface CreateCourseStep1Props {
  courseData: CourseData;
  setCourseData: (data: CourseData) => void;
  onNext: () => void;
}

export const CreateCourseStep1 = ({ courseData, setCourseData, onNext }: CreateCourseStep1Props) => {
  const { toast } = useToast();

  const handleNext = () => {
    if (!courseData.title.trim()) {
      toast({
        title: "Error",
        description: "Course title is required.",
        variant: "destructive",
      });
      return;
    }

    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Step 1: Course Information</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Course Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Google Software Engineer Prep"
              value={courseData.title}
              onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Course Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of what this course covers..."
              value={courseData.description}
              onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext}>
          Next: Configure Stages
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
