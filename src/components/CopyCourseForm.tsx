import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Copy, BookOpen } from "lucide-react";
import { CreateCourseWorkflow } from "./CreateCourseWorkflow";

interface Course {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

interface CourseStage {
  title: string;
  description: string;
  information: string;
  stage_order: number;
}

interface CopyCourseFormProps {
  onSuccess: () => void;
}

export const CopyCourseForm = ({ onSuccess }: CopyCourseFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseStages, setCourseStages] = useState<CourseStage[]>([]);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourse = async (course: Course) => {
    setCopying(true);
    try {
      // Fetch stages for the selected course
      const { data: stages, error } = await supabase
        .from('course_stages')
        .select('*')
        .eq('course_id', course.id)
        .order('stage_order');
      
      if (error) throw error;

      // Transform stages to match the expected format
      const transformedStages: CourseStage[] = (stages || []).map(stage => ({
        title: stage.title,
        description: stage.description || "",
        information: stage.information || "",
        stage_order: stage.stage_order,
      }));

      setSelectedCourse(course);
      setCourseStages(transformedStages);
      
      toast({
        title: "Course Selected",
        description: `Ready to copy "${course.title}". You can now edit it before saving.`,
      });
    } catch (error) {
      console.error('Error fetching course stages:', error);
      toast({
        title: "Error",
        description: "Failed to load course details.",
        variant: "destructive",
      });
    } finally {
      setCopying(false);
    }
  };

  if (selectedCourse) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg border">
          <Copy className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-medium text-blue-900">Copying: {selectedCourse.title}</p>
            <p className="text-sm text-blue-700">Edit the details below and create your new course</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSelectedCourse(null)}
            className="ml-auto"
          >
            Choose Different Course
          </Button>
        </div>
        
        <CreateCourseWorkflow
          onSuccess={onSuccess}
          initialCourseData={{
            title: `Copy of ${selectedCourse.title}`,
            description: selectedCourse.description || "",
          }}
          initialStages={courseStages}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading courses...</p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No courses available</h3>
        <p className="text-gray-500">Create your first course to enable copying.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Select a Course to Copy</h3>
        <p className="text-gray-600">Choose an existing course as a starting point for your new course.</p>
      </div>

      <div className="grid gap-4">
        {courses.map((course) => (
          <Card key={course.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <Badge variant="outline">
                  {new Date(course.created_at).toLocaleDateString()}
                </Badge>
              </div>
              {course.description && (
                <CardDescription className="text-sm">
                  {course.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => handleSelectCourse(course)}
                disabled={copying}
                className="w-full"
                variant="outline"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copying ? "Loading..." : "Copy This Course"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};