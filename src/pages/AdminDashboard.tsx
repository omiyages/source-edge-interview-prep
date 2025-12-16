import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Clock, LogOut, Users, AlertCircle, Home, UserPlus, BarChart } from "lucide-react";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import { UsersList } from "@/components/UsersList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AssignCourseForm } from "@/components/AssignCourseForm";
import { CourseReviewsAdmin } from "@/components/CourseReviewsAdmin";
import { CourseProgressList } from "@/components/CourseProgressList";
import { CreateUserForm } from "@/components/CreateUserForm";
import { BulkUserCreation } from "@/components/BulkUserCreation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { KanbanBoard } from "@/components/KanbanBoard";
import { UpcomingInterviews } from "@/components/UpcomingInterviews";
import { PendingTasks } from "@/components/PendingTasks";
import { ReportTab } from "@/components/ReportTab";
import { ManageReloResources } from "@/components/ManageReloResources";

interface InterviewQuestion {
  id: string;
  question: string;
  company: string;
  role: string;
  interview_stage: string;
  category: string;
  submitted_by: string | null;
  additional_context: string | null;
  created_at: string;
  question_type: string;
  source_url: string | null;
  source_website: string | null;
  scraped_at: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
}

const AdminDashboard = () => {
  const { user, profile, isAdmin, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showBulkUserCreation, setShowBulkUserCreation] = useState(false);

  console.log('🚀 AdminDashboard: Component mounted/rendered');
  console.log('🔧 AdminDashboard render - DETAILED:', {
    hasUser: !!user,
    userEmail: user?.email,
    hasProfile: !!profile,
    profileRole: profile?.role,
    isAdmin,
    authLoading,
    currentUrl: window.location.href,
    timestamp: new Date().toISOString()
  });

  // Move ALL hooks to the top - this is critical for React's Rules of Hooks
  const shouldFetchData = !!user && isAdmin && !authLoading;

  // Fetch pending questions - always call this hook
  const { data: pendingQuestions, isLoading: loadingPending, error: pendingError } = useQuery({
    queryKey: ['admin-pending-questions'],
    queryFn: async () => {
      console.log('📥 Fetching pending questions...');
      const { data, error } = await supabase
        .from('interview_questions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching pending questions:', error);
        throw error;
      }
      
      console.log('✅ Pending questions loaded:', data?.length || 0);
      return data as InterviewQuestion[];
    },
    enabled: shouldFetchData,
  });

  // Fetch all questions - always call this hook
  const { data: allQuestions, isLoading: loadingAll, error: allError } = useQuery({
    queryKey: ['admin-all-questions'],
    queryFn: async () => {
      console.log('📥 Fetching all questions...');
      const { data, error } = await supabase
        .from('interview_questions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching all questions:', error);
        throw error;
      }
      
      console.log('✅ All questions loaded:', data?.length || 0);
      return data as InterviewQuestion[];
    },
    enabled: shouldFetchData,
  });

  // Question approval mutation - always call this hook
  const approveQuestionMutation = useMutation({
    mutationFn: async ({ questionId, status }: { questionId: string; status: 'approved' | 'rejected' }) => {
      console.log('🔄 Updating question status:', { questionId, status });
      const { error } = await supabase
        .from('interview_questions')
        .update({
          status,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', questionId);
      
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-questions'] });
      queryClient.invalidateQueries({ queryKey: ['interview-questions'] });
      
      toast({
        title: status === 'approved' ? "Question Approved" : "Question Rejected",
        description: `The question has been ${status}.`,
      });
    },
    onError: (error) => {
      console.error('❌ Error updating question status:', error);
      toast({
        title: "Error",
        description: "Failed to update question status.",
        variant: "destructive",
      });
    },
  });

  // NOW do conditional rendering after all hooks are called
  if (authLoading) {
    console.log('🔄 AdminDashboard: Still loading auth, showing spinner...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-semibold">Loading admin dashboard...</p>
          <p className="text-sm text-muted-foreground mt-2">Auth loading: {authLoading ? 'true' : 'false'}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('🚫 AdminDashboard: No user found, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  if (!profile) {
    console.log('🔄 AdminDashboard: User exists but no profile, showing loading...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-semibold">Loading user profile...</p>
          <p className="text-sm text-muted-foreground mt-2">User: {user.email}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    console.log('🚫 AdminDashboard: User is not admin, redirecting home:', { 
      hasUser: !!user, 
      email: user.email, 
      role: profile?.role,
      isAdmin
    });
    return <Navigate to="/" replace />;
  }

  console.log('✅ AdminDashboard: All checks passed, rendering dashboard');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleTypeColor = (roleType: string) => {
    switch (roleType) {
      case 'Backend Engineer': return 'bg-blue-100 text-blue-800';
      case 'Frontend Engineer': return 'bg-green-100 text-green-800';
      case 'SRE/DevOps': return 'bg-orange-100 text-orange-800';
      case 'Engineering Manager': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Admin' }]} className="mb-4" />
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-foreground mb-2">
              Admin Dashboard
            </h1>
            <p className="text-lg text-foreground font-semibold">
              Welcome back, {profile?.email} 
              <span className="text-primary font-bold ml-2">👑 Admin</span>
            </p>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Error Alerts */}
        {(pendingError || allError) && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading data. Please try refreshing the page.
              {pendingError && <div>Pending error: {pendingError.message}</div>}
              {allError && <div>All questions error: {allError.message}</div>}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="courses">
              Course Management
            </TabsTrigger>
            <TabsTrigger value="questions">
              Questions ({pendingQuestions?.length || 0} pending)
            </TabsTrigger>
          </TabsList>

          {/* Users Tab with Subtabs */}
          <TabsContent value="users">
            <Tabs defaultValue="kanban" className="w-full">
              <TabsList className="grid w-full grid-cols-6 mb-6">
                <TabsTrigger value="kanban">
                  <Users className="w-4 h-4 mr-2" />
                  Kanban Board
                </TabsTrigger>
                <TabsTrigger value="report">
                  <BarChart className="w-4 h-4 mr-2" />
                  Report
                </TabsTrigger>
                <TabsTrigger value="upcoming-interviews">
                  <Clock className="w-4 h-4 mr-2" />
                  Upcoming Interviews
                </TabsTrigger>
                <TabsTrigger value="pending-tasks">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Pending Tasks
                </TabsTrigger>
                <TabsTrigger value="users-list">
                  <Users className="w-4 h-4 mr-2" />
                  Users List
                </TabsTrigger>
                <TabsTrigger value="create-user">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create User
                </TabsTrigger>
              </TabsList>

              <TabsContent value="kanban">
                <KanbanBoard />
              </TabsContent>

              <TabsContent value="report">
                <ReportTab />
              </TabsContent>

              <TabsContent value="upcoming-interviews">
                <UpcomingInterviews />
              </TabsContent>

              <TabsContent value="pending-tasks">
                <PendingTasks />
              </TabsContent>

              <TabsContent value="users-list">
                <UsersList />
              </TabsContent>

              <TabsContent value="create-user">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">User Management</h3>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setShowBulkUserCreation(true)}
                        className="flex items-center gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        Bulk Create Users
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <CreateUserForm />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Course Management Tab with Subtabs */}
          <TabsContent value="courses">
            <Tabs defaultValue="assignments" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="assignments">
                  Course Assignments
                </TabsTrigger>
                <TabsTrigger value="progress">
                  Course Progress
                </TabsTrigger>
                <TabsTrigger value="reviews">
                  Course Reviews
                </TabsTrigger>
              </TabsList>

              <TabsContent value="assignments">
                <AssignCourseForm />
              </TabsContent>

              <TabsContent value="progress">
                <CourseProgressList />
              </TabsContent>

              <TabsContent value="reviews">
                <CourseReviewsAdmin />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Questions Tab with Subtabs */}
          <TabsContent value="questions">
            <Tabs defaultValue="management" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="management">
                  Questions Management
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending Questions ({pendingQuestions?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="relo-resources">
                  Relo Resources
                </TabsTrigger>
              </TabsList>

              <TabsContent value="management">
                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold mb-2">Questions Management</h3>
                  <p className="text-muted-foreground">Question management features will be available here.</p>
                </div>
              </TabsContent>

              <TabsContent value="pending">
                {loadingPending && (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i}>
                        <CardHeader className="pb-3">
                          <LoadingSkeleton lines={1} className="mb-2" />
                          <LoadingSkeleton lines={2} />
                        </CardHeader>
                        <CardContent className="pt-0">
                          <LoadingSkeleton lines={3} />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {!loadingPending && pendingQuestions?.length === 0 && (
                  <EmptyState
                    title="No pending questions"
                    description="All questions have been reviewed."
                    icon={<Clock className="w-16 h-16 mx-auto text-gray-400" />}
                  />
                )}

                {!loadingPending && (pendingQuestions?.length ?? 0) > 0 && (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {pendingQuestions?.map((question) => (
                      <Card key={question.id} className="hover:shadow-lg transition-shadow duration-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                            <Badge className={getRoleTypeColor(question.role)}>
                              {question.role}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg leading-tight">
                            {question.question}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div className="text-sm text-gray-600">
                              <strong>Company:</strong> {question.company}
                            </div>
                            <div className="text-sm text-gray-600">
                              <strong>Category:</strong> {question.category}
                            </div>
                            <div className="text-sm text-gray-600">
                              <strong>Stage:</strong> {question.interview_stage}
                            </div>
                            {question.additional_context && (
                              <div className="p-3 bg-gray-50 rounded-md text-sm">
                                {question.additional_context}
                              </div>
                            )}
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                className="bg-purple-gradient hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 transition-all duration-300 text-white font-medium"
                                onClick={() => approveQuestionMutation.mutate({ 
                                  questionId: question.id, 
                                  status: 'approved' 
                                })}
                                disabled={approveQuestionMutation.isPending}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => approveQuestionMutation.mutate({ 
                                  questionId: question.id, 
                                  status: 'rejected' 
                                })}
                                disabled={approveQuestionMutation.isPending}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="relo-resources">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Manage Relo Page Resources</h3>
                    <p className="text-muted-foreground mb-6">
                      Select which resources should be displayed on the Relocation to Tokyo Guide page.
                    </p>
                  </div>
                  <ManageReloResources onSuccess={() => {}} />
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bulk User Creation Modal */}
      {showBulkUserCreation && (
        <BulkUserCreation onClose={() => setShowBulkUserCreation(false)} />
      )}
    </div>
  );
};

export default AdminDashboard;
