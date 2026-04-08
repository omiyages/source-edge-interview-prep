import type { ATSParser, ParseResult, ParsedJob } from "./types";
import { classifyRole } from "./classify";
import { clerkSupabaseClient } from "@/lib/clerk";

export const herpParser: ATSParser = {
  platform: "herp",

  extractSlug(url: string): string | null {
    const match = url.trim().match(/^https?:\/\/herp\.careers\/v1\/([^/\s?#]+)/i);
    return match?.[1] ?? null;
  },

  async fetchJobs(slug: string, originalUrl?: string): Promise<ParseResult> {
    const url = (originalUrl?.trim() || `https://herp.careers/v1/${slug}`).trim();

    try {
      const { data, error } = await clerkSupabaseClient.functions.invoke<{
        success?: boolean;
        jobs?: ParsedJob[];
        error?: string | null;
      }>("scrape-herp-jobs", {
        body: { url },
      });

      if (error) {
        return {
          success: false,
          jobs: [],
          error: `HERP proxy (${error.name}): ${error.message}. Deploy Edge Function scrape-herp-jobs if missing.`,
        };
      }

      const payload = data;
      if (!payload?.success) {
        return {
          success: false,
          jobs: [],
          error: payload?.error ?? "HERP proxy returned no jobs",
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
        error: `HERP proxy failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
};

