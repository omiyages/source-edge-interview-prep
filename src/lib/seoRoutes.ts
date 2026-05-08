import { seoLandingPages } from "../content/seoLandingPages";

export type SitemapRoute = {
  path: string;
  changefreq: "daily" | "weekly" | "monthly";
  priority: number;
};

export const publicCompanyRoutes: SitemapRoute[] = [
  { path: "/company", changefreq: "weekly", priority: 0.8 },
  { path: "/company/woven", changefreq: "weekly", priority: 0.8 },
  { path: "/company/shippio", changefreq: "weekly", priority: 0.8 },
  { path: "/company/japan-ai", changefreq: "weekly", priority: 0.8 },
];

export const indexableStaticRoutes: SitemapRoute[] = [
  { path: "/", changefreq: "daily", priority: 1.0 },
  { path: "/questions", changefreq: "daily", priority: 0.9 },
  { path: "/tracks", changefreq: "weekly", priority: 0.85 },
  { path: "/jobs", changefreq: "daily", priority: 0.95 },
  { path: "/resources", changefreq: "weekly", priority: 0.8 },
  { path: "/blog", changefreq: "daily", priority: 0.85 },
  { path: "/relo", changefreq: "weekly", priority: 0.75 },
  ...publicCompanyRoutes,
  ...seoLandingPages.map((page) => ({
    path: page.path,
    changefreq: "weekly" as const,
    priority: 0.76,
  })),
];

export const noindexStaticRoutes = ["/signup", "/roles", "/dashboard", "/admin"];
