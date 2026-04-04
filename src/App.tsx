
// ABOUTME: Main application component with simplified routing and proper error handling
// ABOUTME: Fixed routing to prevent blank pages and ensure proper authentication flow
import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { queryClient } from "@/lib/queryClient";
import { SessionTracker } from "@/components/SessionTracker";
import { TIMEZONE_CONFIG } from "@/config/timezone";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Critical path components - imported directly for fast initial load
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import PublicSignup from "./pages/PublicSignup";

// Lazy loaded components - reduces initial bundle size
const Index = lazy(() => import("./pages/Index"));
const Track = lazy(() => import("./pages/Track"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Resources = lazy(() => import("./pages/Resources"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Companies = lazy(() => import("./pages/Companies"));
const CompanyDetail = lazy(() => import("./pages/CompanyDetail"));
const Relo = lazy(() => import("./pages/Relo"));
const Questions = lazy(() => import("./pages/Questions"));
const Roles = lazy(() => import("./pages/Roles"));
const RoleDetail = lazy(() => import("./pages/RoleDetail"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <LoadingSpinner size="lg" />
  </div>
);

function App() {
  // Initialize timezone settings and clear dark mode
  React.useEffect(() => {
    // Clear any stored dark mode preferences to fix users stuck in dark mode
    localStorage.removeItem('theme');
    localStorage.removeItem('vite-ui-theme');
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
    
    // Set timezone for the application
    document.documentElement.setAttribute('data-timezone', TIMEZONE_CONFIG.timezone);
    
    // Set locale for date formatting
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      // Configure default locale
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
            <SessionTracker />
            <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/signup" element={<PublicSignup />} />
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
              path="/admin/bd-jobs"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Navigate to="/admin?tab=bd-jobs" replace />
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
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <Companies />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/company/:companyId" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <CompanyDetail />
                  </Suspense>
                </ProtectedRoute>
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
