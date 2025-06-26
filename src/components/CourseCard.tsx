
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Users } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
}

interface CourseCardProps {
  course: Course;
}

export const CourseCard = ({ course }: CourseCardProps) => {
  const handleViewCourse = () => {
    window.location.href = `/track/${course.id}`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <Badge variant="secondary" className="text-xs">
            Course
          </Badge>
        </div>
        <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2">
          {course.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {course.description && (
          <p className="text-gray-600 text-sm line-clamp-3">
            {course.description}
          </p>
        )}
        
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(course.created_at).toLocaleDateString()}
          </div>
        </div>

        <Button 
          onClick={handleViewCourse}
          className="w-full mt-4"
          variant="outline"
        >
          View Course
        </Button>
      </CardContent>
    </Card>
  );
};
