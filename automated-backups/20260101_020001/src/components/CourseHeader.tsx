
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
      <div className="bg-white rounded-lg p-6 shadow-sm border border-border mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
              <h1 className="text-3xl font-semibold text-foreground text-center sm:text-left">{course.title}</h1>
              {course.company && (
                <Badge className="bg-primary text-primary-foreground px-3 py-1 mx-auto sm:mx-0">
                  {course.company}
                </Badge>
              )}
            </div>
            {course.description && (
              <p className="text-base text-muted-foreground">{course.description}</p>
            )}
          </div>
          {isAdmin && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="whitespace-nowrap">
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
        
        {/* Relevant Positions */}
        {course.attached_jobs && course.attached_jobs.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 mb-2">Relevant Positions</p>
                <div className="flex flex-wrap gap-2">
                  {course.attached_jobs.map((job, index) => (
                    <Badge 
                      key={index} 
                      className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1 hover:bg-blue-100 hover:text-blue-700"
                    >
                      {job}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
