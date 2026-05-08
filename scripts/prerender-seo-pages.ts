import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { seoLandingPages } from "../src/content/seoLandingPages.ts";
import {
  buildBreadcrumbJsonLd,
  buildBlogPostingJsonLd,
  buildJobPostingJsonLd,
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  stripHtml,
  toAbsoluteUrl,
  trimDescription,
} from "../src/lib/seo.ts";
import type { Role } from "../src/types/role.ts";
import type { BlogPost } from "../src/types/blog.ts";
import WOVEN_DATA from "../src/pages/WovenCompanyPage/data.ts";
import SHIPPIO_DATA from "../src/pages/ShippioCompanyPage/data.ts";
import JAPAN_AI_DATA from "../src/pages/JapanAICompanyPage/data.ts";

type PrerenderPage = {
  path: string;
  title: string;
  description: string;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  includeCompanyFonts?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

const staticPages: PrerenderPage[] = [
  {
    path: "/",
    title: "Tokyo Tech Jobs, Interview Prep, and Career Guides",
    description:
      "Omiyages helps English-speaking and bilingual candidates prepare for software engineering, machine learning, product, and other tech roles in Tokyo and Japan.",
    jsonLd: [buildWebsiteJsonLd(), buildOrganizationJsonLd()],
  },
  {
    path: "/jobs",
    title: "Tech Jobs in Tokyo and Japan",
    description:
      "Browse software engineering, machine learning, product, and other technical jobs in Tokyo and Japan for English-speaking and bilingual candidates.",
    jsonLd: buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Jobs", path: "/jobs" },
    ]),
  },
  {
    path: "/questions",
    title: "Interview Questions for Tech Jobs in Japan",
    description:
      "Practice interview questions for software engineering, machine learning, product, and technical roles in Tokyo and Japan.",
    jsonLd: buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Questions", path: "/questions" },
    ]),
  },
  {
    path: "/tracks",
    title: "Interview Prep Tracks for Tech Jobs in Japan",
    description:
      "Follow structured interview prep tracks for software engineering, machine learning, product, and other technical careers in Tokyo and Japan.",
    jsonLd: buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Tracks", path: "/tracks" },
    ]),
  },
  {
    path: "/resources",
    title: "Interview Resources for Tech Jobs in Japan",
    description:
      "Find curated interview resources for software engineering, machine learning, product, and technical roles in Tokyo and Japan.",
    jsonLd: buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Resources", path: "/resources" },
    ]),
  },
  {
    path: "/relo",
    title: "Relocation to Tokyo Guide for Tech Job Seekers",
    description:
      "Estimate Tokyo take-home salary, review relocation resources, and understand the cost of moving to Japan for a technical role.",
    jsonLd: buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Relocation to Tokyo Guide", path: "/relo" },
    ]),
  },
  {
    path: "/company",
    title: "Tech Companies Hiring in Tokyo and Japan",
    description:
      "Research English-friendly and bilingual-friendly tech companies in Tokyo and Japan, then move from company research to jobs and interview prep.",
    jsonLd: buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Companies", path: "/company" },
    ]),
  },
  {
    path: "/blog",
    title: "Blog — Interview Tips, Japan Tech Careers, and Job Search Guides",
    description:
      "Read articles about job searching in Japan, interview preparation tips, visa sponsorship, and career advice for software engineers, ML engineers, and product managers.",
    jsonLd: buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
    ]),
  },
];

const companyPages = [WOVEN_DATA, SHIPPIO_DATA, JAPAN_AI_DATA].map((data) => ({
  path: `/company/${data.slug}`,
  title: `${data.name} Jobs, Interview Guide & Company Overview`,
  description: trimDescription(
    `${data.description} Explore company context, interview preparation tips, and relevant jobs for ${data.name} on Omiyages.`,
    165
  ),
  includeCompanyFonts: true,
  jsonLd: buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Companies", path: "/company" },
    { name: data.name, path: `/company/${data.slug}` },
  ]),
}));

const guidePages = seoLandingPages.map((page) => ({
  path: page.path,
  title: page.metaTitle,
  description: page.description,
  jsonLd: buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Guides", path: page.path },
  ]),
}));

function buildCanonical(pathname: string) {
  return `${SITE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

function replaceOrInsert(html: string, pattern: RegExp, replacement: string) {
  if (pattern.test(html)) {
    return html.replace(pattern, replacement);
  }
  return html.replace("</head>", `${replacement}\n</head>`);
}

function injectMetaTags(html: string, page: PrerenderPage) {
  const canonical = buildCanonical(page.path);
  const pageTitle = page.title.includes(SITE_NAME) ? page.title : `${page.title} | ${SITE_NAME}`;
  const socialImage = toAbsoluteUrl(page.image || DEFAULT_OG_IMAGE);
  const robots = page.noindex ? "noindex,nofollow" : "index,follow";
  const type = page.type || "website";
  const jsonLdString = page.jsonLd
    ? JSON.stringify(Array.isArray(page.jsonLd) ? page.jsonLd : [page.jsonLd])
    : null;

  let nextHtml = html;
  nextHtml = nextHtml.replace(/<title>.*?<\/title>/is, `<title>${pageTitle}</title>`);
  nextHtml = replaceOrInsert(
    nextHtml,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${page.description}" />`
  );
  nextHtml = replaceOrInsert(
    nextHtml,
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${canonical}" />`
  );
  nextHtml = replaceOrInsert(
    nextHtml,
    /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="robots" content="${robots}" />`
  );
  nextHtml = replaceOrInsert(
    nextHtml,
    /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:type" content="${type}" />`
  );
  nextHtml = replaceOrInsert(
    nextHtml,
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${pageTitle}" />`
  );
  nextHtml = replaceOrInsert(
    nextHtml,
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${page.description}" />`
  );
  nextHtml = replaceOrInsert(
    nextHtml,
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${canonical}" />`
  );
  nextHtml = replaceOrInsert(
    nextHtml,
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${socialImage}" />`
  );
  nextHtml = replaceOrInsert(
    nextHtml,
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${pageTitle}" />`
  );
  nextHtml = replaceOrInsert(
    nextHtml,
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${page.description}" />`
  );
  nextHtml = replaceOrInsert(
    nextHtml,
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${socialImage}" />`
  );

  if (jsonLdString) {
    nextHtml = nextHtml.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/i, "");
    nextHtml = nextHtml.replace(
      "</head>",
      `  <script type="application/ld+json">${jsonLdString}</script>\n</head>`
    );
  }

  if (page.includeCompanyFonts) {
    const companyFontMarkup = [
      '  <link rel="preconnect" href="https://fonts.googleapis.com" />',
      '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
      '  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" />',
      '  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" />',
    ].join("\n");

    nextHtml = nextHtml.replace("</head>", `${companyFontMarkup}\n</head>`);
  }

  return nextHtml;
}

async function getRolePages(): Promise<PrerenderPage[]> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const isProductionBuild = process.env.VERCEL_ENV === "production";

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isProductionBuild) {
      throw new Error(
        "[prerender] Missing Supabase env vars in production. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY."
      );
    }
    console.warn("[prerender] Missing Supabase env vars, skipping dynamic job prerender.");
    return [];
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data, error } = await client
      .from("roles")
      .select(
        "id, slug, job_title, role_type, company, location, working_style, japanese_level, division, job_description, requirements, nice_to_haves, benefits, status, ai_summary, created_at, updated_at, last_seen_at"
      )
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return ((data || []) as Role[]).map((role) => {
      const candidate = (role.slug || role.id || "").trim();
      const pagePath = `/job/${candidate}`;
      const baseText = stripHtml(role.job_description || role.ai_summary);
      const description = trimDescription(
        `${role.job_title} at ${role.company} in ${role.location}. ${baseText}`.trim(),
        165
      );

      return {
        path: pagePath,
        title: `${role.job_title} at ${role.company}`,
        description,
        type: "article" as const,
        jsonLd: [
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Jobs", path: "/jobs" },
            { name: role.job_title, path: pagePath },
          ]),
          buildJobPostingJsonLd(role, pagePath),
        ],
      };
    });
  } catch (error) {
    console.warn("[prerender] Failed to fetch active roles, skipping dynamic job prerender.", error);
    return [];
  }
}

async function getBlogPages(): Promise<PrerenderPage[]> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[prerender] Missing Supabase env vars, skipping blog prerender.");
    return [];
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data, error } = await client
      .from("blog_posts")
      .select(
        "id, slug, title, excerpt, content, cover_image, author_id, status, tags, meta_title, meta_description, published_at, created_at, updated_at"
      )
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) throw error;

    return ((data || []) as unknown as BlogPost[]).map((post) => {
      const pagePath = `/blog/${post.slug}`;
      const description = trimDescription(
        post.meta_description || post.excerpt || stripHtml(post.content),
        165
      );

      return {
        path: pagePath,
        title: post.meta_title || post.title,
        description,
        type: "article" as const,
        image: post.cover_image || undefined,
        jsonLd: [
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: pagePath },
          ]),
          buildBlogPostingJsonLd(post, pagePath),
        ],
      };
    });
  } catch (error) {
    console.warn("[prerender] Failed to fetch blog posts, skipping blog prerender.", error);
    return [];
  }
}

async function writeRouteHtml(distDir: string, templateHtml: string, page: PrerenderPage) {
  const outputHtml = injectMetaTags(templateHtml, page);
  const routePath = page.path === "/" ? "" : page.path.replace(/^\//, "");
  const outputDir = path.join(distDir, routePath);
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "index.html"), outputHtml, "utf8");
}

async function main() {
  const distDir = path.resolve(process.cwd(), "dist");
  const templatePath = path.join(distDir, "index.html");
  const templateHtml = await readFile(templatePath, "utf8");

  const [dynamicRolePages, dynamicBlogPages] = await Promise.all([
    getRolePages(),
    getBlogPages(),
  ]);
  const allPages = [...staticPages, ...companyPages, ...guidePages, ...dynamicRolePages, ...dynamicBlogPages];

  for (const page of allPages) {
    await writeRouteHtml(distDir, templateHtml, page);
  }

  console.log(`[prerender] Wrote ${allPages.length} prerendered HTML routes.`);
}

main().catch((error) => {
  console.error("[prerender] Failed to generate prerendered SEO pages", error);
  process.exitCode = 1;
});
