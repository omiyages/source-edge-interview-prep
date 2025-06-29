
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Clock, LogOut, Users, AlertCircle, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UsersList } from "@/components/UsersList";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log('🔧 AdminDashboard render:', {
    hasUser: !!user,
    userEmail: user?.email,
    hasProfile: !!profile,
    profileRole: profile?.role,
    isAdmin,
    authLoading
  });

  // Show loading while auth is still loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated or not admin
  if (!user || !isAdmin) {
    console.log('🚫 Access denied - redirecting:', { hasUser: !!user, isAdmin });
    return <Navigate to="/auth" replace />;
  }

  // Fetch pending questions
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
    enabled: !!user && isAdmin,
  });

  // Fetch all questions
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
    enabled: !!user && isAdmin,
  });

  // Question approval mutation
  const approveQuestionMutation = useMutation({
    mutationFn: async ({ questionId, status }: { questionId: string; status: 'approved' | 'rejected' }) => {
      console.log('🔄 Updating question status:', { questionId, status });
      const { error } = await supabase
        .from('interview_questions')
        .update({
          status,
          approved_by: user.id,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Welcome back, {profile?.email}
            </p>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
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
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="pending">
              Pending Questions ({pendingQuestions?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="all">
              All Questions ({allQuestions?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {loadingPending ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading pending questions...</p>
              </div>
            ) : (
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
                            className="bg-green-600 hover:bg-green-700 text-white"
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
            
            {pendingQuestions?.length === 0 && !loadingPending && (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No pending questions</h3>
                <p className="text-gray-500">All questions have been reviewed.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="all">
            {loadingAll ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading all questions...</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {allQuestions?.map((question) => (
                  <Card key={question.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge className={getStatusColor(question.status)}>
                          {question.status}
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
                      <div className="space-y-2 text-sm text-gray-600">
                        <div><strong>Company:</strong> {question.company}</div>
                        <div><strong>Category:</strong> {question.category}</div>
                        <div><strong>Stage:</strong> {question.interview_stage}</div>
                        {question.additional_context && (
                          <div className="p-3 bg-gray-50 rounded-md">
                            {question.additional_context}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users">
            <UsersList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
