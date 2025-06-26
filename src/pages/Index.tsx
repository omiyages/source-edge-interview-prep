import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuestionCard from "@/components/QuestionCard";
import { SubmitQuestionForm } from "@/components/SubmitQuestionForm";
import { Search, Filter, Plus, User, Settings, LogOut, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigate, useNavigate, Link } from "react-router-dom";

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
  status: string;
}

const Index = () => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const { data: questions, isLoading, refetch } = useQuery({
    queryKey: ['interview-questions', searchTerm, selectedCompany, selectedRole, selectedCategory, selectedStage],
    queryFn: async () => {
      let query = supabase
        .from('interview_questions')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`question.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%,role.ilike.%${searchTerm}%`);
      }
      
      if (selectedCompany) {
        query = query.eq('company', selectedCompany);
      }
      
      if (selectedRole) {
        query = query.eq('role', selectedRole);
      }
      
      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }
      
      if (selectedStage) {
        query = query.eq('interview_stage', selectedStage);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InterviewQuestion[];
    },
  });

  // Get unique values for filters
  const companies = [...new Set(questions?.map(q => q.company) || [])].sort();
  const roles = [...new Set(questions?.map(q => q.role) || [])].sort();
  const categories = [...new Set(questions?.map(q => q.category) || [])].sort();
  const stages = [...new Set(questions?.map(q => q.interview_stage) || [])].sort();

  const handleQuestionSubmitted = () => {
    setShowSubmitForm(false);
    refetch();
    toast({
      title: "Question Submitted",
      description: "Your question has been submitted for review.",
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCompany("");
    setSelectedRole("");
    setSelectedCategory("");
    setSelectedStage("");
  };

  const handleAdminDashboard = () => {
    console.log('Navigating to admin dashboard, user profile:', profile);
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Interview Questions Database
            </h1>
            <p className="text-lg text-gray-600">
              Discover and share real interview experiences from top tech companies
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/track">
              <Button variant="outline">
                <BookOpen className="w-4 h-4 mr-2" />
                Interview Tracks
              </Button>
            </Link>
            {profile?.role === 'admin' && (
              <Button 
                variant="outline" 
                onClick={handleAdminDashboard}
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin Dashboard
              </Button>
            )}
            <Button variant="outline" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Filters and Submit Button */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search questions, companies, or roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map(company => (
                  <SelectItem key={company} value={company}>{company}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Stage" />
              </SelectTrigger>
              <SelectContent>
                {stages.map(stage => (
                  <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Submit Question Button */}
        <div className="mb-8">
          <Button 
            onClick={() => setShowSubmitForm(!showSubmitForm)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showSubmitForm ? 'Cancel' : 'Submit a Question'}
          </Button>
        </div>

        {/* Submit Question Form */}
        {showSubmitForm && (
          <div className="mb-8">
            <SubmitQuestionForm onSuccess={handleQuestionSubmitted} />
          </div>
        )}

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {questions?.length || 0} interview questions
          </p>
        </div>

        {/* Questions Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading questions...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {questions?.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
              />
            ))}
          </div>
        )}

        {questions?.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Filter className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No questions found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or submit a new question.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
