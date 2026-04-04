import type { ATSParser, ParseResult, ParsedJob } from "./types";
import { classifyRole } from "./classify";

interface WorkableWidgetJob {
  title: string;
  shortcode: string;
  employment_type: string;
  telecommuting: boolean;
  department: string | null;
  url: string;
  city: string;
  state: string;
  country: string;
  function: string;
  industry: string;
  locations: { country: string; city: string; region: string }[];
}

interface WorkableWidgetResponse {
  name: string;
  description: string;
  jobs: WorkableWidgetJob[];
}

interface WorkableWidgetJobDetail {
  description: string;
  requirements: string;
  benefits: string;
}

interface JobsBoardJob {
  id: string;
  title: string;
  department: string | null;
  description: string;
  requirementsSection: string;
  benefitsSection: string;
  employmentType: string | null;
  workplace: string | null;
  url: string;
  location: { city: string; subregion: string; countryName: string } | null;
  locations: string[];
}

interface JobsBoardResponse {
  totalSize: number;
  nextPageToken: string | null;
  jobs: JobsBoardJob[];
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchWidgetJobDetail(
  slug: string,
  shortcode: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://apply.workable.com/api/v2/accounts/${slug}/jobs/${shortcode}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const detail: WorkableWidgetJobDetail = await res.json();
    const parts = [detail.description, detail.requirements, detail.benefits]
      .filter(Boolean)
      .map(stripHtml);
    return parts.join("\n\n") || null;
  } catch {
    return null;
  }
}

const JOBS_BOARD_RE = /^https?:\/\/jobs\.workable\.com\/company\/([^/\s?#]+)/i;

function isJobsBoardUrl(url: string | undefined): string | null {
  if (!url) return null;
  const m = url.trim().match(JOBS_BOARD_RE);
  return m?.[1] ?? null;
}

async function fetchFromJobsBoard(companyId: string): Promise<ParseResult> {
  try {
    const allJobs: ParsedJob[] = [];
    let pageToken: string | null = null;

    for (;;) {
      const apiUrl = pageToken
        ? `https://jobs.workable.com/api/v1/companies/${companyId}?pageToken=${encodeURIComponent(pageToken)}`
        : `https://jobs.workable.com/api/v1/companies/${companyId}`;

      const res = await fetch(apiUrl, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        return {
          success: false,
          jobs: [],
          error: `Workable Jobs Board API returned ${res.status}: ${res.statusText}`,
        };
      }

      const data: JobsBoardResponse = await res.json();

      for (const job of data.jobs) {
        const locParts = [
          job.location?.city,
          job.location?.subregion,
          job.location?.countryName,
        ].filter(Boolean);
        const location = locParts.join(", ") || (job.locations?.[0] ?? null);

        const descParts = [job.description, job.requirementsSection, job.benefitsSection]
          .filter(Boolean)
          .map(stripHtml);

        allJobs.push({
          external_id: job.id,
          title: job.title,
          location: location || null,
          department: job.department ?? null,
          team: null,
          commitment: job.employmentType || null,
          workplace_type: job.workplace || null,
          hosted_url: job.url ?? null,
          description_plain: descParts.join("\n\n") || null,
          japanese_level: null,
          role_category: classifyRole(job.title, job.department),
          tech_stack: null,
        });
      }

      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
    }

    return { success: true, jobs: allJobs };
  } catch (err) {
    return {
      success: false,
      jobs: [],
      error: `Failed to fetch Workable jobs: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function fetchFromWidgetApi(slug: string): Promise<ParseResult> {
  try {
    const response = await fetch(
      `https://apply.workable.com/api/v1/widget/accounts/${slug}`,
      { headers: { Accept: "application/json" } }
    );

    if (!response.ok) {
      return {
        success: false,
        jobs: [],
        error: `Workable API returned ${response.status}: ${response.statusText}`,
      };
    }

    const data: WorkableWidgetResponse = await response.json();

    const BATCH_SIZE = 5;
    const jobs: ParsedJob[] = [];

    for (let i = 0; i < data.jobs.length; i += BATCH_SIZE) {
      const batch = data.jobs.slice(i, i + BATCH_SIZE);
      const details = await Promise.all(
        batch.map((job) => fetchWidgetJobDetail(slug, job.shortcode))
      );

      for (let j = 0; j < batch.length; j++) {
        const job = batch[j];
        const location = [job.city, job.state, job.country]
          .filter(Boolean)
          .join(", ");

        jobs.push({
          external_id: job.shortcode,
          title: job.title,
          location: location || null,
          department: job.department ?? null,
          team: null,
          commitment: job.employment_type || null,
          workplace_type: job.telecommuting ? "remote" : null,
          hosted_url: job.url ?? null,
          description_plain: details[j],
          japanese_level: null,
          role_category: classifyRole(job.title, job.department),
          tech_stack: null,
        });
      }
    }

    return { success: true, jobs };
  } catch (err) {
    return {
      success: false,
      jobs: [],
      error: `Failed to fetch Workable jobs: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export const workableParser: ATSParser = {
  platform: "workable",

  extractSlug(url: string): string | null {
    const patterns = [
      JOBS_BOARD_RE,
      /^https?:\/\/apply\.workable\.com\/api\/v1\/widget\/accounts\/([^/\s?#]+)/i,
      /^https?:\/\/apply\.workable\.com\/([^/\s?#]+)/i,
    ];
    for (const p of patterns) {
      const match = url.trim().match(p);
      if (match?.[1]) return match[1];
    }
    return null;
  },

  async fetchJobs(slug: string, originalUrl?: string): Promise<ParseResult> {
    const companyId = isJobsBoardUrl(originalUrl);
    if (companyId) {
      return fetchFromJobsBoard(companyId);
    }
    return fetchFromWidgetApi(slug);
  },
};
