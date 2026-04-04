import type { ATSParser, ParseResult, ParsedJob } from "./types";
import { classifyRole } from "./classify";

interface GreenhouseJob {
  id: number;
  title: string;
  updated_at: string;
  location: { name: string } | null;
  absolute_url: string;
  departments: { id: number; name: string }[];
  offices: { id: number; name: string; location: string }[];
  content?: string;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
  meta: { total: number };
}

export const greenhouseParser: ATSParser = {
  platform: "greenhouse",

  extractSlug(url: string): string | null {
    const patterns = [
      /^https?:\/\/job-boards\.greenhouse\.io\/([^/\s?#]+)/i,
      /^https?:\/\/boards\.greenhouse\.io\/([^/\s?#]+)/i,
      /^https?:\/\/boards-api\.greenhouse\.io\/v1\/boards\/([^/\s?#]+)/i,
    ];
    for (const p of patterns) {
      const match = url.trim().match(p);
      if (match?.[1]) return match[1];
    }
    return null;
  },

  async fetchJobs(slug: string): Promise<ParseResult> {
    try {
      const response = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`,
        { headers: { Accept: "application/json" } }
      );

      if (!response.ok) {
        return {
          success: false,
          jobs: [],
          error: `Greenhouse API returned ${response.status}: ${response.statusText}`,
        };
      }

      const data: GreenhouseResponse = await response.json();

      const jobs: ParsedJob[] = data.jobs.map((job) => ({
        external_id: String(job.id),
        title: job.title,
        location: job.location?.name ?? null,
        department: job.departments?.[0]?.name ?? null,
        team: null,
        commitment: null,
        workplace_type: null,
        hosted_url: job.absolute_url ?? null,
        description_plain: job.content
          ? job.content.replace(/<[^>]*>/g, "")
          : null,
        japanese_level: null,
        role_category: classifyRole(job.title, job.departments?.[0]?.name),
        tech_stack: null,
      }));

      return { success: true, jobs };
    } catch (err) {
      return {
        success: false,
        jobs: [],
        error: `Failed to fetch Greenhouse jobs: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
};
