import type { ATSParser, ParseResult, ParsedJob } from "./types";
import { classifyRole } from "./classify";

interface LdJobPosting {
  "@type": string;
  title: string;
  description: string;
  identifier?: { value: string };
  datePosted?: string;
  employmentType?: string;
  jobLocationType?: string;
  applicantLocationRequirements?: { name: string };
  jobLocation?: {
    address?: {
      addressLocality?: string;
      addressRegion?: string;
      addressCountry?: string;
    };
  }[];
}

function stripHtml(html: string): string {
  return html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractJobUrlsFromSitemap(xml: string): string[] {
  const urls: string[] = [];
  const re = /<loc>(.*?)<\/loc>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    if (/\/jobs\/\d+/.test(m[1])) {
      urls.push(m[1]);
    }
  }
  return urls;
}

function sanitizeJsonString(raw: string): string {
  const result: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (escaped) {
      result.push(ch);
      escaped = false;
      continue;
    }
    if (ch === "\\" && inString) {
      result.push(ch);
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      result.push(ch);
      continue;
    }
    if (inString) {
      const code = ch.charCodeAt(0);
      if (code < 0x20) {
        if (ch === "\n") result.push("\\n");
        else if (ch === "\r") result.push("\\r");
        else if (ch === "\t") result.push("\\t");
        else result.push(`\\u${code.toString(16).padStart(4, "0")}`);
        continue;
      }
    }
    result.push(ch);
  }
  return result.join("");
}

function extractLdJson(html: string): LdJobPosting | null {
  const re =
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i;
  const match = html.match(re);
  if (!match) return null;
  try {
    const raw = match[1];
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = JSON.parse(sanitizeJsonString(raw));
    }
    if (data["@type"] === "JobPosting") return data as LdJobPosting;
    if (Array.isArray(data)) {
      return (data.find((d) => d["@type"] === "JobPosting") as LdJobPosting) ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

function buildLocation(posting: LdJobPosting): string | null {
  const parts: string[] = [];

  if (posting.jobLocation?.length) {
    const addr = posting.jobLocation[0].address;
    if (addr) {
      if (addr.addressLocality) parts.push(addr.addressLocality);
      if (addr.addressRegion && addr.addressRegion !== addr.addressLocality)
        parts.push(addr.addressRegion);
      if (addr.addressCountry) parts.push(addr.addressCountry);
    }
  }

  if (parts.length === 0 && posting.applicantLocationRequirements?.name) {
    parts.push(posting.applicantLocationRequirements.name);
  }

  if (posting.jobLocationType === "TELECOMMUTE") {
    parts.push("Remote");
  }

  return parts.length > 0 ? parts.join(", ") : null;
}

function mapEmploymentType(raw?: string): string | null {
  if (!raw) return null;
  const map: Record<string, string> = {
    FULL_TIME: "Full-time",
    PART_TIME: "Part-time",
    CONTRACTOR: "Contractor",
    INTERN: "Intern",
    TEMPORARY: "Temporary",
  };
  return map[raw] ?? raw;
}

export const teamtailorParser: ATSParser = {
  platform: "teamtailor",

  extractSlug(url: string): string | null {
    const match = url
      .trim()
      .match(
        /^https?:\/\/(?:careers|jobs|career|join)\.([^./\s]+)\.[^/\s]+/i
      );
    if (match?.[1]) return match[1];

    const customMatch = url
      .trim()
      .match(/^https?:\/\/([^./\s]+)\.teamtailor\.com/i);
    if (customMatch?.[1]) return customMatch[1];

    return null;
  },

  async fetchJobs(slug: string, originalUrl?: string): Promise<ParseResult> {
    let baseOrigin: string;
    if (originalUrl) {
      try {
        const u = new URL(originalUrl.trim());
        baseOrigin = u.origin;
      } catch {
        baseOrigin = `https://careers.${slug}.com`;
      }
    } else {
      baseOrigin = `https://careers.${slug}.com`;
    }
    const sitemapUrl = `${baseOrigin}/sitemap.xml`;

    try {
      const sitemapRes = await fetch(sitemapUrl);
      if (!sitemapRes.ok) {
        return {
          success: false,
          jobs: [],
          error: `Failed to fetch sitemap from ${sitemapUrl} (${sitemapRes.status})`,
        };
      }

      const xml = await sitemapRes.text();
      const jobUrls = extractJobUrlsFromSitemap(xml);

      if (jobUrls.length === 0) {
        return { success: true, jobs: [] };
      }

      const BATCH_SIZE = 5;
      const jobs: ParsedJob[] = [];

      for (let i = 0; i < jobUrls.length; i += BATCH_SIZE) {
        const batch = jobUrls.slice(i, i + BATCH_SIZE);
        const pages = await Promise.all(
          batch.map(async (jobUrl) => {
            try {
              const res = await fetch(jobUrl);
              return res.ok ? await res.text() : null;
            } catch {
              return null;
            }
          })
        );

        for (let j = 0; j < batch.length; j++) {
          const html = pages[j];
          if (!html) continue;

          const posting = extractLdJson(html);
          if (!posting) continue;

          const idMatch = batch[j].match(/\/jobs\/(\d+)/);
          const externalId =
            posting.identifier?.value ?? idMatch?.[1] ?? batch[j];

          const descPlain = stripHtml(posting.description);

          jobs.push({
            external_id: externalId,
            title: posting.title,
            location: buildLocation(posting),
            department: null,
            team: null,
            commitment: mapEmploymentType(posting.employmentType),
            workplace_type:
              posting.jobLocationType === "TELECOMMUTE" ? "remote" : null,
            hosted_url: batch[j],
            description_plain: descPlain || null,
            japanese_level: null,
            role_category: classifyRole(posting.title),
            tech_stack: null,
          });
        }
      }

      return { success: true, jobs };
    } catch (err) {
      return {
        success: false,
        jobs: [],
        error: `Failed to fetch Teamtailor jobs: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
};
