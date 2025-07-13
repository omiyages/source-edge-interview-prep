
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight } from "lucide-react";
import { CourseCompanyJobFields } from "@/components/CourseCompanyJobFields";

interface CourseData {
  title: string;
  description: string;
  company: string;
  attachedJobs: string[];
}

interface CreateCourseStep1Props {
  courseData: CourseData;
  setCourseData: (data: CourseData) => void;
  onNext: () => void;
}

export const CreateCourseStep1 = ({ courseData, setCourseData, onNext }: CreateCourseStep1Props) => {
  const handleNext = () => {
    if (!courseData.title.trim()) {
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

          <CourseCompanyJobFields
            company={courseData.company}
            attachedJobs={courseData.attachedJobs}
            onCompanyChange={(company) => setCourseData({ ...courseData, company })}
            onAttachedJobsChange={(attachedJobs) => setCourseData({ ...courseData, attachedJobs })}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext} disabled={!courseData.title.trim()}>
          Next: Define Stages
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
