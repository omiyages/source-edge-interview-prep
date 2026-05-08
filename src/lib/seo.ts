import type { Role } from "@/types/role";
import type { BlogPost } from "@/types/blog";

export const SITE_NAME = "Omiyages";
export const SITE_URL = "https://omiyages.com";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/omiyages-social-image.png`;

type BreadcrumbItem = {
  name: string;
  path: string;
};

export function toAbsoluteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function trimDescription(text: string | null | undefined, maxLength = 160): string {
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export function stripHtml(html: string | null | undefined): string {
  return (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  };
}

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "en",
    audience: {
      "@type": "Audience",
      audienceType: "English-speaking and bilingual tech job seekers in Japan",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/questions?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: DEFAULT_OG_IMAGE,
    sameAs: [],
    description:
      "Omiyages helps English-speaking and bilingual job seekers prepare for software engineering, machine learning, product, and technical interviews in Tokyo and Japan.",
  };
}

export function buildBlogPostingJsonLd(post: BlogPost, path: string) {
  const description = trimDescription(
    post.meta_description || post.excerpt || stripHtml(post.content),
    300
  );
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.meta_title || post.title,
    description,
    url: toAbsoluteUrl(path),
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    ...(post.cover_image && { image: toAbsoluteUrl(post.cover_image) }),
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: DEFAULT_OG_IMAGE },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": toAbsoluteUrl(path),
    },
    ...(post.tags.length > 0 && { keywords: post.tags.join(", ") }),
  };
}

export function buildJobPostingJsonLd(role: Role, path: string) {
  const description = trimDescription(stripHtml(role.job_description || role.ai_summary), 400);
  const qualifications = [role.requirements, role.nice_to_haves]
    .map((value) => stripHtml(value))
    .filter(Boolean)
    .join("\n\n");
  const benefits = stripHtml(role.benefits);
  const responsibilities = stripHtml(role.job_description);
  const jobPosting: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: role.job_title,
    description,
    datePosted: role.created_at,
    dateModified: role.updated_at,
    hiringOrganization: {
      "@type": "Organization",
      name: role.company,
    },
    identifier: {
      "@type": "PropertyValue",
      name: role.company,
      value: role.slug || role.id,
    },
    occupationalCategory: [role.role_type, role.division].filter(Boolean).join(" / ") || "Technology",
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: role.location,
        addressCountry: "JP",
      },
    },
    applicantLocationRequirements: {
      "@type": "Country",
      name: "Japan",
    },
    url: toAbsoluteUrl(path),
    industry: role.role_type || "Technology",
  };

  if (qualifications) {
    jobPosting.qualifications = qualifications;
    jobPosting.skills = qualifications;
  }

  if (responsibilities) {
    jobPosting.responsibilities = responsibilities;
  }

  if (benefits) {
    jobPosting.jobBenefits = benefits;
  }

  if (role.japanese_level) {
    jobPosting.experienceRequirements = `Japanese level: ${role.japanese_level}`;
  }

  if (role.working_style === "Remote") {
    jobPosting.jobLocationType = "TELECOMMUTE";
  }

  return jobPosting;
}
