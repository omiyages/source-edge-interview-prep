
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { clerkSupabaseClient } from "@/lib/clerk";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserProfile } from "@/types/user";
import { Input } from "@/components/ui/input";

interface AssignCourseFormProps {
  onSuccess?: () => void;
}

export const AssignCourseForm = ({ onSuccess }: AssignCourseFormProps) => {
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [userSearch, setUserSearch] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users-for-assignment'],
    queryFn: async () => {
      const { data, error } = await clerkSupabaseClient
        .from('profiles')
        .select('id, full_name, email, role, is_active')
        .eq('role', 'user')
        .eq('is_active', true);
      
      if (error) throw error;
      return data as UserProfile[];
    },
  });

  const filteredUsers = useMemo(() => {
    if (!users || !userSearch.trim()) return users || [];
    const term = userSearch.toLowerCase();
    return (users || []).filter((u) =>
      (u.full_name || "").toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term)
    );
  }, [users, userSearch]);

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description')
        .order('title');
      
      if (error) throw error;
      return data;
    },
  });

  const assignCourseMutation = useMutation({
    mutationFn: async ({ userId, courseId }: { userId: string; courseId: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await clerkSupabaseClient
        .from('course_assignments')
        .insert({
          user_id: userId,
          course_id: courseId,
          assigned_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return { assignment: data, userId, courseId };
    },
    onSuccess: async (data) => {
      // Send course assignment email (non-blocking)
      try {
        const course = courses?.find(c => c.id === data.courseId);
        if (course) {
          await supabase.functions.invoke('send-email', {
            body: {
              type: 'course_assigned',
              data: {
                userId: data.userId,
                courseName: course.title,
                courseDescription: course.description || null,
              },
            },
          });
        }
      } catch (emailError) {
        // Silently handle non-blocking course assignment email error
      }

      toast({
        title: "Course assigned successfully",
        description: "The course has been assigned and the user has been notified via email.",
      });
      queryClient.invalidateQueries({ queryKey: ['course-assignments'] });
      setSelectedUser("");
      setSelectedCourse("");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to assign course",
        description: error.message || "An error occurred while assigning the course.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedCourse) {
      toast({
        title: "Missing information",
        description: "Please select both a user and a course.",
        variant: "destructive",
      });
      return;
    }

    assignCourseMutation.mutate({ userId: selectedUser, courseId: selectedCourse });
  };

  if (usersLoading || coursesLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Course to User</CardTitle>
        <CardDescription>
          Select a user and course to create a new assignment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select User</label>
            <div className="mb-2">
              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users by name or email..."
              />
            </div>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user" />
              </SelectTrigger>
              <SelectContent>
                {filteredUsers?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Select Course</label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a course" />
              </SelectTrigger>
              <SelectContent>
                {courses?.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            disabled={assignCourseMutation.isPending || !selectedUser || !selectedCourse}
            className="w-full"
            variant="gradient"
          >
            {assignCourseMutation.isPending ? "Assigning..." : "Assign Course"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
