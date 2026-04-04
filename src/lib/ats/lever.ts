import type { ATSParser, ParseResult, ParsedJob, JapaneseLevel } from "./types";
import { classifyRole } from "./classify";

interface LeverPosting {
  id: string;
  text: string;
  categories: {
    commitment?: string;
    department?: string;
    location?: string;
    team?: string;
    allLocations?: string[];
  };
  hostedUrl?: string;
  descriptionPlain?: string;
  workplaceType?: string;
  createdAt?: number;
  lists?: { text: string; content: string }[];
}

const REQUIRED_SECTION_PATTERNS = [
  /qualif/i,
  /experience/i,
  /skills/i,
  /looking\s*for/i,
  /requirement/i,
];

const NICE_TO_HAVE_SECTION_PATTERNS = [
  /nice\s*to\s*have/i,
  /preferred/i,
  /bonus/i,
  /optional/i,
];

function isRequiredSection(sectionName: string): boolean {
  return REQUIRED_SECTION_PATTERNS.some((p) => p.test(sectionName));
}

function isNiceToHaveSection(sectionName: string): boolean {
  return NICE_TO_HAVE_SECTION_PATTERNS.some((p) => p.test(sectionName));
}

function extractListItems(html: string): string[] {
  const items: string[] = [];
  const re = /<li>(.*?)<\/li>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    items.push(m[1].replace(/<[^>]*>/g, "").trim());
  }
  return items;
}

function detectJapaneseLevelFromText(text: string): JapaneseLevel | null {
  const lower = text.toLowerCase();
  if (!/japanese/i.test(lower)) return null;

  if (/native/i.test(lower) || /fluent/i.test(lower)) return "Native";
  if (/business/i.test(lower) || /professional/i.test(lower)) return "Business";
  if (/conversational/i.test(lower) || /limited\s*working/i.test(lower)) return "Conversational";
  if (/plus/i.test(lower) || /not\s*required/i.test(lower)) return "Nice to Have";

  return "Business";
}

function detectJapaneseLevel(posting: LeverPosting): JapaneseLevel {
  const lists = posting.lists ?? [];

  let requiredLevel: JapaneseLevel | null = null;
  let niceToHaveLevel: JapaneseLevel | null = null;

  for (const list of lists) {
    const sectionName = list.text.trim();
    const items = extractListItems(list.content);

    for (const item of items) {
      const level = detectJapaneseLevelFromText(item);
      if (!level) continue;

      if (isNiceToHaveSection(sectionName)) {
        if (!niceToHaveLevel) niceToHaveLevel = level;
      } else if (isRequiredSection(sectionName)) {
        if (
          !requiredLevel ||
          levelRank(level) > levelRank(requiredLevel)
        ) {
          requiredLevel = level;
        }
      } else {
        if (
          !requiredLevel ||
          levelRank(level) > levelRank(requiredLevel)
        ) {
          requiredLevel = level;
        }
      }
    }
  }

  if (requiredLevel) return requiredLevel;
  if (niceToHaveLevel) return "Nice to Have";
  return "None";
}

function levelRank(level: JapaneseLevel): number {
  switch (level) {
    case "Native": return 4;
    case "Business": return 3;
    case "Conversational": return 2;
    case "Nice to Have": return 1;
    case "None": return 0;
    default: return 0;
  }
}

export const leverParser: ATSParser = {
  platform: "lever",

  extractSlug(url: string): string | null {
    const patterns = [
      /^https?:\/\/jobs\.lever\.co\/([^/\s?#]+)/i,
      /^https?:\/\/jobs\.eu\.lever\.co\/([^/\s?#]+)/i,
      /^https?:\/\/api\.lever\.co\/v0\/postings\/([^/\s?#]+)/i,
      /^https?:\/\/api\.eu\.lever\.co\/v0\/postings\/([^/\s?#]+)/i,
    ];
    for (const p of patterns) {
      const match = url.trim().match(p);
      if (match?.[1]) return match[1];
    }
    return null;
  },

  async fetchJobs(slug: string): Promise<ParseResult> {
    const isEU = false;
    const baseUrl = isEU
      ? "https://api.eu.lever.co/v0/postings"
      : "https://api.lever.co/v0/postings";

    try {
      const response = await fetch(`${baseUrl}/${slug}?mode=json`, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        return {
          success: false,
          jobs: [],
          error: `Lever API returned ${response.status}: ${response.statusText}`,
        };
      }

      let postings: LeverPosting[] = await response.json();

      if (slug.toLowerCase() === "woven-by-toyota") {
        postings = postings.filter((p) => {
          const hasJapanese = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(p.text);
          const isTokyo = (p.categories?.location ?? "").toLowerCase().includes("tokyo");
          return !hasJapanese && isTokyo;
        });
      }

      const jobs: ParsedJob[] = postings.map((posting) => ({
        external_id: posting.id,
        title: posting.text,
        location: posting.categories?.location ?? null,
        department: posting.categories?.department ?? null,
        team: posting.categories?.team ?? null,
        commitment: posting.categories?.commitment ?? null,
        workplace_type: posting.workplaceType ?? null,
        hosted_url: posting.hostedUrl ?? null,
        description_plain: posting.descriptionPlain
          ? posting.descriptionPlain.slice(0, 2000)
          : null,
        japanese_level: detectJapaneseLevel(posting),
        role_category: classifyRole(
          posting.text,
          posting.categories?.department,
          posting.categories?.team
        ),
        tech_stack: null,
      }));

      return { success: true, jobs };
    } catch (err) {
      return {
        success: false,
        jobs: [],
        error: `Failed to fetch Lever jobs: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
};
