
// ABOUTME: Admin dashboard page that provides comprehensive management interface for administrators
// ABOUTME: Includes candidate pipeline, user management, analytics, and integrations

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { KanbanBoard } from '@/components/KanbanBoard';
import { DataVisualization } from '@/components/DataVisualization';
import { GoogleSheetsIntegrationSection } from '@/components/GoogleSheetsIntegrationSection';
import UsersList from '@/components/UsersList';
import { ErrorBoundary } from '@/components/ui/error-boundary';

const AdminDashboard = () => {
  console.log('🏠 AdminDashboard: Component rendering started');
  
  const { user, isAdmin } = useAuth();
  
  console.log('🏠 AdminDashboard: Auth state:', { 
    hasUser: !!user, 
    userEmail: user?.email, 
    isAdmin 
  });

  if (!isAdmin) {
    console.log('🚫 AdminDashboard: Access denied - not admin');
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  console.log('✅ AdminDashboard: Rendering admin dashboard content');

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="text-sm text-gray-500">
            Welcome back, {user?.email}
          </div>
        </div>

        <Tabs defaultValue="pipeline" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="pending-questions">Pending Questions</TabsTrigger>
            <TabsTrigger value="all-questions">All Questions</TabsTrigger>
            <TabsTrigger value="course-assignment">Course Assignment</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Candidate Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ErrorBoundary>
                  <KanbanBoard />
                </ErrorBoundary>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <ErrorBoundary>
              <UsersList />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <ErrorBoundary>
              <DataVisualization />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="pending-questions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Question Management - Pending Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Question management functionality will be available here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all-questions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Question Management - All Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">All questions management functionality will be available here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="course-assignment" className="space-y-6">
            <ErrorBoundary>
              <GoogleSheetsIntegrationSection />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
};

export default AdminDashboard;
