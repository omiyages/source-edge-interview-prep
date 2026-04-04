export type ATSPlatform = "lever" | "greenhouse" | "workable" | "teamtailor" | "hrmos";

export interface DetectionResult {
  platform: ATSPlatform | null;
  slug: string | null;
}

export type JapaneseLevel =
  | "None"
  | "Conversational"
  | "Business"
  | "Native"
  | "Nice to Have"
  | null;

export interface ParsedJob {
  external_id: string;
  title: string;
  location: string | null;
  department: string | null;
  team: string | null;
  commitment: string | null;
  workplace_type: string | null;
  hosted_url: string | null;
  description_plain: string | null;
  japanese_level: JapaneseLevel;
  role_category: string | null;
  tech_stack: string | null;
}

export interface ParseResult {
  success: boolean;
  jobs: ParsedJob[];
  error?: string;
}

export interface ATSParser {
  platform: ATSPlatform;
  extractSlug(url: string): string | null;
  fetchJobs(slug: string, originalUrl?: string): Promise<ParseResult>;
}
