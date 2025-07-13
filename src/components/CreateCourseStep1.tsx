
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
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
  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (courseData.title.trim()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Course</h2>
        <p className="text-gray-600">Step 1: Basic Information</p>
      </div>

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
          <RichTextEditor
            value={courseData.description}
            onChange={(description) => setCourseData({ ...courseData, description })}
            placeholder="Brief description of what this course covers..."
          />
        </div>

        <CourseCompanyJobFields
          company={courseData.company}
          attachedJobs={courseData.attachedJobs}
          onCompanyChange={(company) => setCourseData({ ...courseData, company })}
          onAttachedJobsChange={(attachedJobs) => setCourseData({ ...courseData, attachedJobs })}
        />
      </div>

      <Button type="submit" className="w-full">
        Next: Define Stages
      </Button>
    </form>
  );
};
