
// ABOUTME: Centralized lazy loading for better bundle optimization
// ABOUTME: Contains lazy-loaded imports for heavy page components and feature components
import { lazy } from 'react';

// Page components (excluding AdminDashboard to avoid import issues)
export const Resources = lazy(() => import("@/pages/Resources"));
export const CourseDetail = lazy(() => import("@/pages/CourseDetail"));
export const Track = lazy(() => import("@/pages/Track"));
export const UserDashboard = lazy(() => import("@/pages/UserDashboard"));

// Heavy components
export const QuestionManager = lazy(() => import("@/components/QuestionManager").then(module => ({ default: module.QuestionManager })));
export const ResourcesList = lazy(() => import("@/components/ResourcesList").then(module => ({ default: module.ResourcesList })));
