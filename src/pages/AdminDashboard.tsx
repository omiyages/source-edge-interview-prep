
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { KanbanBoard } from '@/components/KanbanBoard';
import { QuestionManager } from '@/components/QuestionManager';
import { DataVisualization } from '@/components/DataVisualization';
import { SecurityMonitor } from '@/components/SecurityMonitor';
import { GoogleSheetsIntegrationSection } from '@/components/GoogleSheetsIntegrationSection';
import UsersList from '@/components/UsersList';

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
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
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Candidate Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <KanbanBoard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UsersList />
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          <QuestionManager />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <DataVisualization />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecurityMonitor />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <GoogleSheetsIntegrationSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
