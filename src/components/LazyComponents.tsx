// Centralized lazy loading for better bundle optimization
import { lazy } from 'react';

// Page components
export const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
export const Resources = lazy(() => import("@/pages/Resources"));
export const CourseDetail = lazy(() => import("@/pages/CourseDetail"));
export const Track = lazy(() => import("@/pages/Track"));
export const UserDashboard = lazy(() => import("@/pages/UserDashboard"));

// Heavy components
export const KanbanBoard = lazy(() => import("@/components/KanbanBoard").then(module => ({ default: module.KanbanBoard })));
export const QuestionManager = lazy(() => import("@/components/QuestionManager").then(module => ({ default: module.QuestionManager })));
export const ResourcesList = lazy(() => import("@/components/ResourcesList").then(module => ({ default: module.ResourcesList })));