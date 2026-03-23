
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Edit, Briefcase } from "lucide-react";
import { EditCourseForm } from "./EditCourseForm";
import { useQuery } from "@tanstack/react-query";
import { fetchRoleLinksByJobTitles } from "@/services/coursesService";

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
  const { data: roleLinks } = useQuery({
    queryKey: ['role-links', course.attached_jobs],
    queryFn: async () => {
      if (!course.attached_jobs || course.attached_jobs.length === 0) return [];
      const roleLinks = await fetchRoleLinksByJobTitles(course.attached_jobs);
      const titleSet = new Set(course.attached_jobs.map((job) => job.trim().toLowerCase()));
      return roleLinks
        .filter((role) => titleSet.has(role.job_title.trim().toLowerCase()))
        .map(r => ({ id: r.id, slug: r.slug, job_title: r.job_title }));
    },
    enabled: !!course.attached_jobs && course.attached_jobs.length > 0,
    staleTime: 5 * 60_000,
  });

  return (
    <>
      {/* Course Info Card */}
      <div className="bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-800 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
              {course.company && (
                <Badge className="bg-primary/10 text-primary border-0 px-3 py-1 w-fit text-xs font-semibold uppercase tracking-wide">
                  {course.company}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{course.title}</h1>
            {course.description && (
              <p className="text-base text-neutral-400 leading-relaxed">{course.description}</p>
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

        {/* Relevant Roles */}
        {course.attached_jobs && course.attached_jobs.length > 0 && (
          <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-neutral-700 rounded-lg flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-neutral-400" />
              </div>
              <p className="text-sm text-neutral-400">
                <span className="font-semibold text-neutral-300">Relevant Roles:</span>{" "}
                {course.attached_jobs.map((job, idx) => {
                  const match = roleLinks?.find(
                    r => r.job_title.trim().toLowerCase() === job.trim().toLowerCase()
                  );
                  return (
                    <span key={idx}>
                      {idx > 0 && ", "}
                      {match ? (
                        <Link
                          to={`/job/${match.slug || match.id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {job}
                        </Link>
                      ) : (
                        job
                      )}
                    </span>
                  );
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
