import { detectATS } from "./detector";
import { greenhouseParser } from "./greenhouse";
import { hrmosParser } from "./hrmos";
import { leverParser } from "./lever";
import { teamtailorParser } from "./teamtailor";
import type { ATSParser, ATSPlatform, ParseResult } from "./types";
import { workableParser } from "./workable";

const parsers: Record<ATSPlatform, ATSParser> = {
  lever: leverParser,
  greenhouse: greenhouseParser,
  workable: workableParser,
  teamtailor: teamtailorParser,
  hrmos: hrmosParser,
};

export type ParseCareersUrlResult = ParseResult & {
  platform: ATSPlatform | null;
  slug: string | null;
};

export async function parseJobsFromCareersUrl(url: string): Promise<ParseCareersUrlResult> {
  const trimmed = url.trim();
  if (!trimmed) {
    return {
      success: false,
      jobs: [],
      platform: null,
      slug: null,
      error: "Enter a careers page URL",
    };
  }

  const { platform, slug } = detectATS(trimmed);
  if (!platform || !slug) {
    return {
      success: false,
      jobs: [],
      platform: null,
      slug: null,
      error:
        "Unsupported URL. Try Lever, Greenhouse, Workable, Teamtailor, or HRMOS job board links.",
    };
  }

  const result = await parsers[platform].fetchJobs(slug, trimmed);
  return { ...result, platform, slug };
}
