
// ABOUTME: Centralized lazy loading for better bundle optimization with more granular splitting
// ABOUTME: Contains lazy-loaded imports organized by feature area to minimize initial bundle size

import { lazy } from 'react';

// Critical page components - loaded on demand
export const Resources = lazy(() => import("@/pages/Resources"));
export const CourseDetail = lazy(() => import("@/pages/CourseDetail"));
export const Track = lazy(() => import("@/pages/Track"));
export const UserDashboard = lazy(() => import("@/pages/UserDashboard"));

// Feature-specific component groups to enable better code splitting
export const QuestionFeatures = {
  QuestionManager: lazy(() => import("@/components/QuestionManager").then(module => ({ default: module.QuestionManager }))),
  SubmitQuestionForm: lazy(() => import("@/components/SubmitQuestionForm").then(module => ({ default: module.SubmitQuestionForm }))),
  EditQuestionForm: lazy(() => import("@/components/EditQuestionForm").then(module => ({ default: module.EditQuestionForm }))),
};

export const ResourceFeatures = {
  ResourcesList: lazy(() => import("@/components/ResourcesList").then(module => ({ default: module.ResourcesList }))),
  CreateResourceForm: lazy(() => import("@/components/CreateResourceForm").then(module => ({ default: module.CreateResourceForm }))),
};

export const AdminFeatures = {
  AdminRoleManager: lazy(() => import("@/components/AdminRoleManager").then(module => ({ default: module.AdminRoleManager }))),
  UsersList: lazy(() => import("@/components/UsersList").then(module => ({ default: module.UsersList }))),
  CreateCourseForm: lazy(() => import("@/components/CreateCourseForm").then(module => ({ default: module.CreateCourseForm }))),
  EditCourseForm: lazy(() => import("@/components/EditCourseForm").then(module => ({ default: module.EditCourseForm }))),
  CSVImportForm: lazy(() => import("@/components/CSVImportForm").then(module => ({ default: module.CSVImportForm }))),
};

// Backward compatibility exports (these will be tree-shaken if not used)
export const QuestionManager = QuestionFeatures.QuestionManager;
export const ResourcesList = ResourceFeatures.ResourcesList;
export const AdminRoleManager = AdminFeatures.AdminRoleManager;
export const UsersList = AdminFeatures.UsersList;
export const CreateCourseForm = AdminFeatures.CreateCourseForm;
export const EditCourseForm = AdminFeatures.EditCourseForm;
export const SubmitQuestionForm = QuestionFeatures.SubmitQuestionForm;
export const EditQuestionForm = QuestionFeatures.EditQuestionForm;
export const CreateResourceForm = ResourceFeatures.CreateResourceForm;
export const CSVImportForm = AdminFeatures.CSVImportForm;
