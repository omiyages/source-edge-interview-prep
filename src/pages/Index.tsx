
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, LogOut, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubmitQuestionForm } from "@/components/SubmitQuestionForm";
import { ScrapeQuestionsForm } from "@/components/ScrapeQuestionsForm";
import QuestionCard from "@/components/QuestionCard";

interface InterviewQuestion {
  id: string;
  question: string;
  company: string;
  role: string;
  difficulty: string;
  interview_stage: string;
  category: string;
  submitted_by: string | null;
  additional_context: string | null;
  created_at: string;
  question_type: string;
  source_url: string | null;
  source_website: string | null;
  scraped_at: string | null;
}

const Index = () => {
  const { user, profile, loading, signOut, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleTypeFilter, setRoleTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [questionTypeFilter, setQuestionTypeFilter] = useState("all");
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  // Redirect to auth if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  const { data: questions, isLoading, refetch } = useQuery({
    queryKey: ['interview-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interview_questions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as InterviewQuestion[];
    },
    enabled: !!user,
  });

  const filteredQuestions = questions?.filter(question => {
    const matchesSearch = question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRoleType = roleTypeFilter === "all" || question.role === roleTypeFilter;
    const matchesCategory = categoryFilter === "all" || question.category === categoryFilter;
    const matchesType = questionTypeFilter === "all" || question.question_type === questionTypeFilter;
    
    return matchesSearch && matchesRoleType && matchesCategory && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <h1 className="text-4xl font-bold text-gray-900">
              Interview Questions Directory
            </h1>
            <div className="flex gap-2">
              {isAdmin && (
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/admin'}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              )}
              <Button variant="outline" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Browse real interview questions from top companies. Learn from others' experiences and contribute your own.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Welcome back, {profile?.email} ({profile?.role})
          </p>
        </div>

        {/* Filters and Submit Button */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search questions, companies, or roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={roleTypeFilter} onValueChange={setRoleTypeFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Role Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Role Types</SelectItem>
                <SelectItem value="Backend Engineer">Backend Engineer</SelectItem>
                <SelectItem value="Frontend Engineer">Frontend Engineer</SelectItem>
                <SelectItem value="SRE/DevOps">SRE/DevOps</SelectItem>
                <SelectItem value="Engineering Manager">Engineering Manager</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Technical">Technical</SelectItem>
                <SelectItem value="Behavioral">Behavioral</SelectItem>
                <SelectItem value="System Design">System Design</SelectItem>
                <SelectItem value="Problem Solving">Problem Solving</SelectItem>
                <SelectItem value="Culture Fit">Culture Fit</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={questionTypeFilter} onValueChange={setQuestionTypeFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="user_submitted">User Submitted</SelectItem>
                <SelectItem value="online_sourced">Online Sourced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {filteredQuestions?.length || 0} questions found
            </p>
            
            <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Questions
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Interview Questions</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="submit" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="submit">Submit Question</TabsTrigger>
                    <TabsTrigger value="scrape">Scrape Questions</TabsTrigger>
                  </TabsList>
                  <TabsContent value="submit">
                    <SubmitQuestionForm 
                      onSuccess={() => {
                        setIsSubmitDialogOpen(false);
                        refetch();
                      }} 
                    />
                  </TabsContent>
                  <TabsContent value="scrape">
                    <ScrapeQuestionsForm 
                      onSuccess={() => {
                        setIsSubmitDialogOpen(false);
                        refetch();
                      }} 
                    />
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Questions Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading questions...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredQuestions?.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))}
          </div>
        )}

        {filteredQuestions?.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No questions found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
