import type { DetectionResult, ATSPlatform } from "./types";

interface URLPattern {
  platform: ATSPlatform;
  patterns: RegExp[];
}

const ATS_PATTERNS: URLPattern[] = [
  {
    platform: "lever",
    patterns: [
      /^https?:\/\/jobs\.lever\.co\/([^/\s?#]+)/i,
      /^https?:\/\/jobs\.eu\.lever\.co\/([^/\s?#]+)/i,
      /^https?:\/\/api\.lever\.co\/v0\/postings\/([^/\s?#]+)/i,
      /^https?:\/\/api\.eu\.lever\.co\/v0\/postings\/([^/\s?#]+)/i,
    ],
  },
  {
    platform: "greenhouse",
    patterns: [
      /^https?:\/\/job-boards\.greenhouse\.io\/([^/\s?#]+)/i,
      /^https?:\/\/boards\.greenhouse\.io\/([^/\s?#]+)/i,
      /^https?:\/\/boards-api\.greenhouse\.io\/v1\/boards\/([^/\s?#]+)/i,
      /^https?:\/\/([^.]+)\.greenhouse\.io/i,
    ],
  },
  {
    platform: "workable",
    patterns: [
      /^https?:\/\/(?:www\.)?jobs\.workable\.com\/company\/([^/\s?#]+)/i,
      /^https?:\/\/(?:www\.)?apply\.workable\.com\/api\/v1\/widget\/accounts\/([^/\s?#]+)/i,
      /^https?:\/\/(?:www\.)?apply\.workable\.com\/([^/\s?#]+)/i,
    ],
  },
  {
    platform: "teamtailor",
    patterns: [
      /^https?:\/\/([^./\s]+)\.teamtailor\.com/i,
      /^https?:\/\/(?:careers|career|jobs|join)\.([^./\s]+)\.[^/\s]+/i,
    ],
  },
  {
    platform: "hrmos",
    patterns: [
      /^https?:\/\/hrmos\.co\/pages\/([^/\s?#]+)/i,
    ],
  },
  {
    platform: "herp",
    patterns: [
      /^https?:\/\/herp\.careers\/v1\/([^/\s?#]+)/i,
    ],
  },
];

export function detectATS(url: string): DetectionResult {
  const trimmed = url.trim();

  for (const { platform, patterns } of ATS_PATTERNS) {
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match && match[1]) {
        return { platform, slug: match[1] };
      }
    }
  }

  return { platform: null, slug: null };
}
