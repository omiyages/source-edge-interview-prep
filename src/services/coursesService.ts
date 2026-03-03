import { supabase } from "@/integrations/supabase/client";

export interface CourseMatch {
  id: string;
  title: string;
  description: string | null;
  company: string | null;
}

export interface RoleLink {
  id: string;
  slug: string | null;
  job_title: string;
}

export async function fetchRecommendedCourseForRole(
  company: string,
  jobTitle: string
): Promise<CourseMatch | null> {
  const normalizedJobTitle = jobTitle.trim().toLowerCase();
  if (!normalizedJobTitle) return null;

  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, description, company, attached_jobs")
    .eq("company", company)
    .not("attached_jobs", "is", null);

  if (error) {
    throw new Error(`Failed to fetch recommended course: ${error.message}`);
  }

  if (!courses || courses.length === 0) return null;

  const match = courses.find(
    (course) =>
      Array.isArray(course.attached_jobs) &&
      course.attached_jobs.some(
        (attachedJob: string) => attachedJob.trim().toLowerCase() === normalizedJobTitle
      )
  );

  if (!match) return null;

  return {
    id: match.id,
    title: match.title,
    description: match.description,
    company: match.company,
  };
}

export async function fetchRoleLinksByJobTitles(jobTitles: string[]): Promise<RoleLink[]> {
  const titles = Array.from(new Set(jobTitles.map((job) => job.trim()).filter(Boolean)));
  if (titles.length === 0) return [];

  const { data, error } = await supabase
    .from("roles")
    .select("id, slug, job_title")
    .in("job_title", titles);

  if (error) {
    throw new Error(`Failed to fetch role links: ${error.message}`);
  }

  return (data ?? []) as RoleLink[];
}
