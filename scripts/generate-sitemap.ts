import { writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { indexableStaticRoutes } from "../src/lib/seoRoutes.ts";

type DynamicSitemapRoute = {
  path: string;
  changefreq: "daily" | "weekly";
  priority: number;
  lastmod?: string;
};

const SITE_URL = "https://omiyages.com";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function getDynamicRoutes(): Promise<DynamicSitemapRoute[]> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const isProductionBuild = process.env.VERCEL_ENV === "production";

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isProductionBuild) {
      throw new Error(
        "[sitemap] Missing Supabase env vars in production. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY."
      );
    }
    console.warn("[sitemap] Missing Supabase env vars, generating static routes only.");
    return [];
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const [
      { data: roleRows, error: rolesError },
      { data: courseRows, error: coursesError },
      { data: blogRows, error: blogError },
    ] = await Promise.all([
      client
        .from("roles")
        .select("slug,id,updated_at,created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      client
        .from("courses")
        .select("slug,updated_at,created_at")
        .not("slug", "is", null)
        .order("created_at", { ascending: false }),
      client
        .from("blog_posts")
        .select("slug,updated_at,published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false }),
    ]);

    if (rolesError) throw rolesError;
    if (coursesError) throw coursesError;
    if (blogError) throw blogError;

    const jobRoutes = (roleRows || [])
      .map((row) => ({
        slug: row.slug || row.id,
        lastmod: row.updated_at || row.created_at,
      }))
      .filter((row) => Boolean(row.slug))
      .map((row) => ({
        path: `/job/${row.slug}`,
        changefreq: "daily" as const,
        priority: 0.9,
        lastmod: row.lastmod,
      }));

    const courseRoutes = (courseRows || [])
      .map((row) => ({
        slug: row.slug,
        lastmod: row.updated_at || row.created_at,
      }))
      .filter((row) => Boolean(row.slug))
      .map((row) => ({
        path: `/course/${row.slug}`,
        changefreq: "weekly" as const,
        priority: 0.72,
        lastmod: row.lastmod,
      }));

    const blogRoutes = (blogRows || [])
      .filter((row) => Boolean(row.slug))
      .map((row) => ({
        path: `/blog/${row.slug}`,
        changefreq: "weekly" as const,
        priority: 0.8,
        lastmod: row.updated_at || row.published_at,
      }));

    return [...jobRoutes, ...courseRoutes, ...blogRoutes];
  } catch (error) {
    console.warn("[sitemap] Failed to fetch dynamic URLs, generating static routes only.", error);
    return [];
  }
}

async function main() {
  const buildTimestamp = new Date().toISOString();
  const staticRoutes: DynamicSitemapRoute[] = indexableStaticRoutes.map((route) => ({
    ...route,
    lastmod: buildTimestamp,
  }));
  const allRoutes = [...staticRoutes, ...(await getDynamicRoutes())];
  const uniqueRoutes = Array.from(new Map(allRoutes.map((route) => [route.path, route])).values());

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueRoutes
  .map(
    (route) => `  <url>
    <loc>${escapeXml(`${SITE_URL}${route.path}`)}</loc>
    ${route.lastmod ? `<lastmod>${escapeXml(route.lastmod)}</lastmod>` : ""}
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

  const outputPath = path.resolve(process.cwd(), "public", "sitemap.xml");
  await writeFile(outputPath, xml, "utf8");
  console.log(`[sitemap] Wrote ${uniqueRoutes.length} URLs to ${outputPath}`);
}

main().catch((error) => {
  console.error("[sitemap] Generation failed", error);
  process.exitCode = 1;
});
