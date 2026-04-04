import type { ATSParser, ParseResult, ParsedJob } from "./types";
import { classifyRole } from "./classify";

interface HrmosJobCard {
  id: string;
  url: string;
  title: string;
  tags: string[];
}

interface LdJobPosting {
  "@type": string;
  title: string;
  description: string;
  identifier?: { value: string };
  employmentType?: string;
  jobLocation?: {
    address?: {
      streetAddress?: string;
      addressLocality?: string | null;
      addressRegion?: string | null;
      postalCode?: string;
    };
  }[];
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

function parseJobCardsFromListing(html: string, _baseUrl: string): HrmosJobCard[] {
  const cards: HrmosJobCard[] = [];
  const delimiter = '<li class="pg-list-cassette';
  const parts = html.split(delimiter);

  const linkPattern =
    /href="((?:https?:\/\/hrmos\.co)?\/pages\/[^/]+\/jobs\/(\d+))"/;
  const titlePattern = /<h2>(.*?)<\/h2>/;
  const tagPattern = /<li[^>]*>(.*?)<\/li>/g;

  const seen = new Set<string>();

  for (let i = 1; i < parts.length; i++) {
    const block = parts[i];

    const linkMatch = block.match(linkPattern);
    if (!linkMatch) continue;
    const id = linkMatch[2];
    if (seen.has(id)) continue;
    seen.add(id);

    const fullUrl = linkMatch[1].startsWith("http")
      ? linkMatch[1]
      : `https://hrmos.co${linkMatch[1]}`;

    const titleMatch = block.match(titlePattern);
    const title = titleMatch?.[1]?.trim() ?? "";

    const tags: string[] = [];
    const tagBlock = block.match(/<ul\s+class="sg-tags[^"]*">([\s\S]*?)<\/ul>/);
    if (tagBlock) {
      let tagM: RegExpExecArray | null;
      while ((tagM = tagPattern.exec(tagBlock[1])) !== null) {
        tags.push(tagM[1].trim());
      }
      tagPattern.lastIndex = 0;
    }

    cards.push({ id, url: fullUrl, title, tags });
  }

  return cards;
}

function buildLocationFromTags(tags: string[]): string | null {
  const locationTag = tags.find((t) => t.includes("Station") || t.includes("Minato") || /\d+-\d+/.test(t));
  const cityTag = tags.find((t) =>
    /^(東京|大阪|福岡|名古屋|京都|横浜|札幌|仙台|神戸|広島|千葉|埼玉|Tokyo|Osaka|Fukuoka)$/i.test(t)
  );
  if (locationTag) return locationTag;
  if (cityTag) return `${cityTag}, Japan`;
  return null;
}

function mapEmploymentType(tags: string[]): string | null {
  if (tags.includes("正社員")) return "Full-time";
  if (tags.includes("契約社員")) return "Contract";
  if (tags.includes("アルバイト・パート")) return "Part-time";
  if (tags.includes("インターン")) return "Intern";
  return null;
}

function extractDepartmentFromTags(tags: string[]): string | null {
  const known = new Set([
    "エンジニア", "東京", "大阪", "福岡", "オープン",
    "English (Mid-career)", "日本語", "正社員", "契約社員",
    "アルバイト・パート", "インターン",
  ]);
  for (const tag of tags) {
    if (known.has(tag)) continue;
    if (tag.includes("Station") || tag.includes("Minato") || /\d+-\d+/.test(tag)) continue;
    return tag;
  }
  return null;
}

interface HrmosJobDetail {
  description: string | null;
  location: string | null;
  employmentType: string | null;
}

async function fetchJobDetail(url: string): Promise<HrmosJobDetail> {
  const empty: HrmosJobDetail = { description: null, location: null, employmentType: null };
  try {
    const res = await fetch(url);
    if (!res.ok) return empty;
    const html = await res.text();

    const re =
      /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i;
    const match = html.match(re);
    if (!match) return empty;

    const raw = match[1];
    let data: LdJobPosting;
    try {
      data = JSON.parse(raw);
    } catch {
      const sanitized = sanitizeJsonString(raw);
      data = JSON.parse(sanitized);
    }

    if (data["@type"] !== "JobPosting") return empty;

    let location: string | null = null;
    if (data.jobLocation?.length) {
      const addr = data.jobLocation[0].address;
      if (addr) {
        const parts = [addr.streetAddress, addr.addressLocality, addr.addressRegion]
          .filter(Boolean)
          .join(", ");
        if (parts) location = parts;
      }
    }

    return {
      description: data.description ? stripHtml(data.description) : null,
      location,
      employmentType: data.employmentType ?? null,
    };
  } catch {
    return empty;
  }
}

function sanitizeJsonString(raw: string): string {
  const result: string[] = [];
  let inStr = false;
  let escaped = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (escaped) {
      result.push(ch);
      escaped = false;
      continue;
    }
    if (ch === "\\" && inStr) {
      result.push(ch);
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inStr = !inStr;
      result.push(ch);
      continue;
    }
    if (inStr) {
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

export const hrmosParser: ATSParser = {
  platform: "hrmos",

  extractSlug(url: string): string | null {
    const match = url.trim().match(/^https?:\/\/hrmos\.co\/pages\/([^/\s?#]+)/i);
    return match?.[1] ?? null;
  },

  async fetchJobs(slug: string, originalUrl?: string): Promise<ParseResult> {
    const listingsUrl = originalUrl?.trim() || `https://hrmos.co/pages/${slug}/jobs`;

    try {
      const res = await fetch(listingsUrl);
      if (!res.ok) {
        return {
          success: false,
          jobs: [],
          error: `HRMOS returned ${res.status}: ${res.statusText}`,
        };
      }

      const html = await res.text();
      const cards = parseJobCardsFromListing(html, listingsUrl);

      if (cards.length === 0) {
        return { success: true, jobs: [] };
      }

      const BATCH_SIZE = 5;
      const jobs: ParsedJob[] = [];

      for (let i = 0; i < cards.length; i += BATCH_SIZE) {
        const batch = cards.slice(i, i + BATCH_SIZE);
        const details = await Promise.all(
          batch.map((card) => fetchJobDetail(card.url))
        );

        for (let j = 0; j < batch.length; j++) {
          const card = batch[j];
          const detail = details[j];
          const location = buildLocationFromTags(card.tags) || detail.location;
          const department = extractDepartmentFromTags(card.tags);
          const commitment = detail.employmentType || mapEmploymentType(card.tags);

          jobs.push({
            external_id: card.id,
            title: card.title,
            location,
            department,
            team: null,
            commitment,
            workplace_type: null,
            hosted_url: card.url,
            description_plain: detail.description,
            japanese_level: null,
            role_category: classifyRole(card.title, department),
            tech_stack: null,
          });
        }
      }

      return { success: true, jobs };
    } catch (err) {
      return {
        success: false,
        jobs: [],
        error: `Failed to fetch HRMOS jobs: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
};
