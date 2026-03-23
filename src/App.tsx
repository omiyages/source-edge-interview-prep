
// ABOUTME: Main application component with simplified routing and proper error handling
// ABOUTME: Fixed routing to prevent blank pages and ensure proper authentication flow
import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { queryClient } from "@/lib/queryClient";
import { SessionTracker } from "@/components/SessionTracker";
import { TIMEZONE_CONFIG } from "@/config/timezone";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Seo } from "@/components/Seo";
import AuthModalProvider from "@/components/AuthModal";

// Critical path components - imported directly for fast initial load
import NotFound from "./pages/NotFound";

// Lazy loaded components - reduces initial bundle size
const Index = lazy(() => import("./pages/Index"));
const Track = lazy(() => import("./pages/Track"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Resources = lazy(() => import("./pages/Resources"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Companies = lazy(() => import("./pages/Companies"));
const CompanyDetail = lazy(() => import("./pages/CompanyDetail"));
const ShippioCompanyPage = lazy(() => import("./pages/ShippioCompanyPage"));
const Relo = lazy(() => import("./pages/Relo"));
const Questions = lazy(() => import("./pages/Questions"));
const SsoCallback = lazy(() => import("./pages/SsoCallback"));
const Roles = lazy(() => import("./pages/Roles"));
const RoleDetail = lazy(() => import("./pages/RoleDetail"));
// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <LoadingSpinner size="lg" />
  </div>
);

type SeoMeta = { title: string; description: string; noindex?: boolean } | null;

// null = page handles its own SEO
const STATIC_SEO: Record<string, SeoMeta> = {
  "/": null,
  "/questions": null,
  "/tracks": { title: "Interview Courses", description: "Explore structured interview preparation courses by company and role." },
  "/jobs": { title: "Open Jobs", description: "Browse active tech job openings in Japan and match them with interview prep resources." },
  "/roles": { title: "Open Jobs", description: "Browse active tech job openings in Japan and match them with interview prep resources." },
  "/resources": { title: "Interview Resources", description: "Find curated interview resources to prepare faster and smarter." },
  "/company": { title: "Companies", description: "Explore companies hiring top tech talent in Japan." },
"/dashboard": { title: "Dashboard", description: "Track your interview preparation progress in one place.", noindex: true },
  "/admin": { title: "Admin Dashboard", description: "Manage questions, users, and content from the Omiyages admin dashboard.", noindex: true },
  "/relo": { title: "Relocation to Tokyo", description: "Guidance and resources for relocating to Tokyo for your next role." },
  "/404": { title: "Omiyages", description: "Interview preparation platform for tech roles in Japan.", noindex: true },
};

const PREFIX_SEO: Array<{ prefix: string; meta: SeoMeta }> = [
  { prefix: "/job/", meta: { title: "Job Details", description: "Review role details, requirements, and responsibilities for this job opening." } },
  { prefix: "/role/", meta: { title: "Job Details", description: "Review role details, requirements, and responsibilities for this job opening." } },
  { prefix: "/course/", meta: { title: "Course Details", description: "View full interview preparation roadmap and stage-by-stage materials." } },
  { prefix: "/company/", meta: { title: "Company Profile", description: "Explore company details, roles, and related interview preparation tracks." } },
];

function AppSeo() {
  const { pathname } = useLocation();

  const meta: SeoMeta = pathname in STATIC_SEO
    ? STATIC_SEO[pathname]
    : (PREFIX_SEO.find(({ prefix }) => pathname.startsWith(prefix))?.meta ?? {
        title: "Omiyages",
        description: "Interview preparation platform for tech roles in Japan.",
      });

  if (!meta) return null;

  return <Seo {...meta} path={pathname} />;
}

function App() {
  // Initialize timezone settings
  React.useEffect(() => {
    document.documentElement.setAttribute('data-timezone', TIMEZONE_CONFIG.timezone);

    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      const originalToLocaleString = Date.prototype.toLocaleString;
      Date.prototype.toLocaleString = function(...args) {
        if (args.length === 0) {
          return originalToLocaleString.call(this, TIMEZONE_CONFIG.locale, { timeZone: TIMEZONE_CONFIG.timezone });
        }
        return originalToLocaleString.apply(this, args);
      };
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthModalProvider>
            <SessionTracker />
            <AppSeo />
            <Routes>
            <Route path="/signup" element={<Navigate to="/" replace />} />
<Route 
              path="/" 
              element={
                <Suspense fallback={<PageLoader />}>
                  <Index />
                </Suspense>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <UserDashboard />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Suspense fallback={<PageLoader />}>
                    <AdminDashboard />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/resources" 
              element={
                <Suspense fallback={<PageLoader />}>
                  <Resources />
                </Suspense>
              } 
            />
            <Route 
              path="/course/:slug" 
              element={
                <Suspense fallback={<PageLoader />}>
                  <CourseDetail />
                </Suspense>
              } 
            />
            <Route 
              path="/tracks" 
              element={
                <Suspense fallback={<PageLoader />}>
                  <Track />
                </Suspense>
              } 
            />
            <Route
              path="/company"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Companies />
                </Suspense>
              }
            />
            <Route
              path="/company/shippio"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ShippioCompanyPage />
                </Suspense>
              }
            />
            <Route
              path="/company/:companyId"
              element={
                <Suspense fallback={<PageLoader />}>
                  <CompanyDetail />
                </Suspense>
              }
            />
            <Route 
              path="/relo" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <Relo />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/questions" 
              element={
                <Suspense fallback={<PageLoader />}>
                  <Questions />
                </Suspense>
              } 
            />
            <Route 
              path="/jobs" 
              element={
                <Suspense fallback={<PageLoader />}>
                  <Roles />
                </Suspense>
              } 
            />
            <Route 
              path="/job/:slug" 
              element={
                <Suspense fallback={<PageLoader />}>
                  <RoleDetail />
                </Suspense>
              } 
            />
            {/* Backward-compatible aliases */}
            <Route 
              path="/roles" 
              element={
                <Suspense fallback={<PageLoader />}>
                  <Roles />
                </Suspense>
              } 
            />
            <Route 
              path="/role/:slug" 
              element={
                <Suspense fallback={<PageLoader />}>
                  <RoleDetail />
                </Suspense>
              } 
            />
              <Route
                path="/sso-callback"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <SsoCallback />
                  </Suspense>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </AuthModalProvider>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
