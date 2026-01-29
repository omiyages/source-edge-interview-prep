
// ABOUTME: Main application component with simplified routing and proper error handling
// ABOUTME: Fixed routing to prevent blank pages and ensure proper authentication flow
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { queryClient } from "@/lib/queryClient";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { SessionTracker } from "@/components/SessionTracker";
import { TIMEZONE_CONFIG } from "@/config/timezone";

// Import components directly
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import PublicSignup from "./pages/PublicSignup";
import AdminDashboard from "./pages/AdminDashboard";
import Resources from "./pages/Resources";
import CourseDetail from "./pages/CourseDetail";
import Track from "./pages/Track";
import UserDashboard from "./pages/UserDashboard";
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";
import Relo from "./pages/Relo";
import Questions from "./pages/Questions";

function App() {
  // Initialize timezone settings
  React.useEffect(() => {
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
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <BrowserRouter>
              <SessionTracker />
              <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/signup" element={<PublicSignup />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/resources" 
                element={
                  <ProtectedRoute>
                    <Resources />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/course/:slug" 
                element={
                  <ProtectedRoute>
                    <CourseDetail />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/tracks" 
                element={
                  <ProtectedRoute>
                    <Track />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/company" 
                element={
                  <ProtectedRoute>
                    <Companies />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/company/:companyId" 
                element={
                  <ProtectedRoute>
                    <CompanyDetail />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/relo" 
                element={
                  <ProtectedRoute>
                    <Relo />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/questions" 
                element={
                  <ProtectedRoute>
                    <Questions />
                  </ProtectedRoute>
                } 
              />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ThemeProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
