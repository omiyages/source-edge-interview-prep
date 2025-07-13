
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
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold text-gray-900">{course.title}</h1>
          {/* Company Badge on the far right */}
          {course.company && (
            <div className="bg-primary/10 rounded-full border border-primary/20 px-4 py-2">
              <span className="text-sm font-medium text-primary">{course.company}</span>
            </div>
          )}
        </div>
        
        {course.description && (
          <p className="text-lg text-gray-600 mb-6">{course.description}</p>
        )}
        
        {/* Jobs Information Only */}
        {course.attached_jobs && course.attached_jobs.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100/50">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg mt-1">
                <Briefcase className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-3">Relevant Positions</p>
                <div className="flex flex-wrap gap-2">
                  {course.attached_jobs.map((job, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="bg-white/80 text-gray-700 border border-gray-200/50 hover:bg-white hover:shadow-sm transition-all duration-200 px-3 py-1"
                    >
                      {job}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {(!course.attached_jobs || course.attached_jobs.length === 0) && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100/50">
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">No position information available</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
