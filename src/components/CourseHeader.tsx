
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Edit } from "lucide-react";
import { EditCourseForm } from "./EditCourseForm";

interface Course {
  id: string;
  title: string;
  description: string | null;
  company: string | null;
  attached_jobs: string[] | null;
  created_at: string;
}

interface CourseStage {
  id: string;
  title: string;
  description: string | null;
  information: string | null;
  stage_order: number;
}

interface CourseHeaderProps {
  course: Course;
  selectedStage: CourseStage | null;
  isAdmin: boolean;
  onCourseUpdate: () => void;
  onQuestionsUpdate: () => void;
}

export const CourseHeader = ({ 
  course, 
  selectedStage, 
  isAdmin, 
  onCourseUpdate,
  onQuestionsUpdate 
}: CourseHeaderProps) => {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link to="/tracks">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tracks
          </Button>
        </Link>
        
        <div className="flex gap-2">
          {isAdmin && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Course
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Course</DialogTitle>
                </DialogHeader>
                <EditCourseForm 
                  course={course}
                  onSuccess={onCourseUpdate}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Course Info */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{course.title}</h1>
        {course.description && (
          <p className="text-lg text-gray-600">{course.description}</p>
        )}
      </div>
    </>
  );
};
