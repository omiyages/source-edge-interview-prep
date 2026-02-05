// ABOUTME: Component to display course progress for all candidates in admin dashboard
// ABOUTME: Shows progress metrics, completion status, and last activity for assigned courses

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { Calendar, CheckCircle, Clock, User, BookOpen } from 'lucide-react';

export const CourseProgressList: React.FC = () => {
  const { progressData, isLoading, error } = useCourseProgress();

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading course progress...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading course progress: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progressData || progressData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No course assignments found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return "text-green-600";
    if (percentage >= 75) return "text-blue-600";
    if (percentage >= 50) return "text-yellow-600";
    if (percentage >= 25) return "text-orange-600";
    return "text-red-600";
  };

  const getProgressBadge = (percentage: number) => {
    if (percentage === 100) return { variant: "default" as const, label: "Completed" };
    if (percentage >= 75) return { variant: "secondary" as const, label: "Almost Done" };
    if (percentage >= 50) return { variant: "outline" as const, label: "In Progress" };
    if (percentage >= 25) return { variant: "outline" as const, label: "Getting Started" };
    return { variant: "secondary" as const, label: "Not Started" };
  };

  // Group by user for better organization
  const userGroups = progressData.reduce((acc, item) => {
    if (!acc[item.user_id]) {
      acc[item.user_id] = {
        user_name: item.user_name,
        user_email: item.user_email,
        courses: []
      };
    }
    acc[item.user_id].courses.push(item);
    return acc;
  }, {} as Record<string, { user_name: string; user_email: string; courses: typeof progressData }>);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressData.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Courses</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {progressData.filter(item => item.progress_percentage === 100).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Candidates</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(userGroups).length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Course Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stages</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {progressData.map((item, index) => {
                  const badgeInfo = getProgressBadge(item.progress_percentage);
                  return (
                    <TableRow key={`${item.user_id}-${item.course_id}-${index}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.user_name}</div>
                          <div className="text-sm text-muted-foreground">{item.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.course_title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={item.progress_percentage} className="w-16 h-2" />
                          <span className={`text-sm font-medium ${getProgressColor(item.progress_percentage)}`}>
                            {item.progress_percentage}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={badgeInfo.variant}>
                          {badgeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {item.completed_stages}/{item.total_stages}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.assigned_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.last_activity ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(item.last_activity).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No activity</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};