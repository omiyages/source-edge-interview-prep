
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Briefcase } from "lucide-react";
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
      {/* Course Info Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
              {course.company && (
                <Badge className="bg-primary/10 text-primary border-0 px-3 py-1 w-fit text-xs font-semibold uppercase tracking-wide">
                  {course.company}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
            {course.description && (
              <p className="text-base text-gray-500 leading-relaxed">{course.description}</p>
            )}
          </div>
          {isAdmin && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="whitespace-nowrap rounded-lg border-gray-200 hover:bg-gray-50">
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

        {/* Relevant Roles */}
        {course.attached_jobs && course.attached_jobs.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-gray-500" />
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-700">Relevant Roles:</span>{" "}
                {course.attached_jobs.join(", ")}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
