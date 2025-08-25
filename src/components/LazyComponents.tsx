

// ABOUTME: Centralized lazy loading for better bundle optimization
// ABOUTME: Contains lazy-loaded imports for heavy page components and feature components
import { lazy } from 'react';

// Page components (excluding AdminDashboard to avoid import issues)
export const Resources = lazy(() => import("@/pages/Resources"));
export const CourseDetail = lazy(() => import("@/pages/CourseDetail"));
export const Track = lazy(() => import("@/pages/Track"));
export const UserDashboard = lazy(() => import("@/pages/UserDashboard"));

// Heavy components - more granular lazy loading
export const QuestionManager = lazy(() => import("@/components/QuestionManager").then(module => ({ default: module.QuestionManager })));
export const ResourcesList = lazy(() => import("@/components/ResourcesList").then(module => ({ default: module.ResourcesList })));

// Admin-specific components (only loaded when needed) - using named exports
export const AdminRoleManager = lazy(() => import("@/components/AdminRoleManager").then(module => ({ default: module.AdminRoleManager })));
export const UsersList = lazy(() => import("@/components/UsersList").then(module => ({ default: module.UsersList })));
export const CreateCourseForm = lazy(() => import("@/components/CreateCourseForm").then(module => ({ default: module.CreateCourseForm })));
export const EditCourseForm = lazy(() => import("@/components/EditCourseForm"));

// Form components (loaded on demand) - using named exports
export const SubmitQuestionForm = lazy(() => import("@/components/SubmitQuestionForm").then(module => ({ default: module.SubmitQuestionForm })));
export const EditQuestionForm = lazy(() => import("@/components/EditQuestionForm"));
export const CreateResourceForm = lazy(() => import("@/components/CreateResourceForm"));
export const CSVImportForm = lazy(() => import("@/components/CSVImportForm").then(module => ({ default: module.CSVImportForm })));

