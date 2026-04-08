import type { ATSParser, ParseResult, ParsedJob } from "./types";
import { classifyRole } from "./classify";
import { clerkSupabaseClient } from "@/lib/clerk";

/**
 * Workable listings are fetched via Edge Function `scrape-workable-jobs` so we use
 * the official JSON APIs server-side (browser requests hit CORS on jobs.workable.com).
 */
export const workableParser: ATSParser = {
  platform: "workable",

  extractSlug(url: string): string | null {
    const patterns = [
      /^https?:\/\/(?:www\.)?jobs\.workable\.com\/company\/([^/\s?#]+)/i,
      /^https?:\/\/(?:www\.)?apply\.workable\.com\/api\/v1\/widget\/accounts\/([^/\s?#]+)/i,
      /^https?:\/\/(?:www\.)?apply\.workable\.com\/([^/\s?#]+)/i,
    ];
    for (const p of patterns) {
      const match = url.trim().match(p);
      if (match?.[1]) return match[1];
    }
    return null;
  },

  async fetchJobs(slug: string, originalUrl?: string): Promise<ParseResult> {
    const url = (originalUrl?.trim() || `https://apply.workable.com/${slug}`).trim();

    try {
      const { data, error } = await clerkSupabaseClient.functions.invoke<{
        success?: boolean;
        jobs?: ParsedJob[];
        error?: string | null;
      }>("scrape-workable-jobs", {
        body: { url },
      });

      if (error) {
        return {
          success: false,
          jobs: [],
          error: `Workable proxy (${error.name}): ${error.message}. Deploy Edge Function scrape-workable-jobs if missing.`,
        };
      }

      const payload = data;
      if (!payload?.success) {
        return {
          success: false,
          jobs: [],
          error: payload?.error ?? "Workable proxy returned no jobs",
        };
      }

      const raw = payload.jobs ?? [];
      const jobs: ParsedJob[] = raw.map((j) => ({
        ...j,
        role_category: classifyRole(j.title, j.department),
      }));

      return { success: true, jobs };
    } catch (err) {
      return {
        success: false,
        jobs: [],
        error: `Workable proxy failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
};
