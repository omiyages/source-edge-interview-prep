
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface CourseReviewFiltersProps {
  onCourseChange: (courseId: string | null) => void;
  onCompanyChange: (company: string | null) => void;
  selectedCourse: string | null;
  selectedCompany: string | null;
}

export const CourseReviewFilters = ({
  onCourseChange,
  onCompanyChange,
  selectedCourse,
  selectedCompany
}: CourseReviewFiltersProps) => {
  const { data: courses } = useQuery({
    queryKey: ['courses-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, company')
        .order('title');
      
      if (error) throw error;
      return data;
    },
  });

  // Get unique companies from courses
  const companies = courses 
    ? Array.from(new Set(courses.map(course => course.company).filter(Boolean)))
    : [];

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="course-filter">Filter by Course</Label>
            <Select
              value={selectedCourse || "all"}
              onValueChange={(value) => onCourseChange(value === "all" ? null : value)}
            >
              <SelectTrigger id="course-filter">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses?.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-filter">Filter by Company</Label>
            <Select
              value={selectedCompany || "all"}
              onValueChange={(value) => onCompanyChange(value === "all" ? null : value)}
            >
              <SelectTrigger id="company-filter">
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
