
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import QuestionCard from "@/components/QuestionCard";
import { SubmitQuestionForm } from "@/components/SubmitQuestionForm";
import { EditQuestionForm } from "@/components/EditQuestionForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, BookOpen, ExternalLink, Settings, MapPin, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InterviewQuestion {
  id: string;
  question: string;
  company: string;
  role: string;
  difficulty: string;
  interview_stage: string;
  category: string;
  approved_at: string | null;
  approved_by: string | null;
  additional_context: string | null;
  team: string | null;
  position_name: string | null;
  submitted_by: string | null;
  created_at: string;
  question_type: string;
  source_url: string | null;
  source_website: string | null;
  scraped_at: string | null;
}

interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string;
  category: string;
  created_at: string;
}

const Index = () => {
  const { user, profile, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<InterviewQuestion[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [interviewStageFilter, setInterviewStageFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<InterviewQuestion | null>(null);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [hasFetchedQuestions, setHasFetchedQuestions] = useState(false);
  const [hasFetchedResources, setHasFetchedResources] = useState(false);

  const categories = ["All", "Technical", "Behavioral", "System Design", "Background", "Culture Fit", "Other"];
  const difficulties = ["All", "Easy", "Medium", "Hard"];
  const interviewStages = ["All", "Phone Screen", "Technical", "Onsite", "Final", "Other"];

  // Fetch questions when user is authenticated and not loading
  useEffect(() => {
    if (authLoading || !user || hasFetchedQuestions) {
      console.log('🔄 Skipping questions fetch:', { authLoading, hasUser: !!user, hasFetchedQuestions });
      return;
    }

    const fetchQuestions = async () => {
      console.log('📥 Fetching questions for user:', user.email);
      setQuestionsLoading(true);
      setQuestionsError(null);
      
      try {
        let query = supabase
          .from('interview_questions')
          .select('*')
          .order('created_at', { ascending: false });

        // Only filter out pending questions for non-admin users
        if (!isAdmin) {
          query = query.neq('status', 'pending');
        }

        const { data, error } = await query;

        if (error) {
          console.error('❌ Error fetching questions:', error);
          throw error;
        }

        console.log('✅ Questions loaded:', data?.length || 0);
        setQuestions(data || []);
        setHasFetchedQuestions(true);
      } catch (error) {
        console.error('❌ Error fetching questions:', error);
        setQuestionsError('Failed to load questions. Please try again.');
        toast({
          title: "Error",
          description: "Failed to load questions.",
          variant: "destructive",
        });
      } finally {
        setQuestionsLoading(false);
      }
    };

    fetchQuestions();
  }, [user, isAdmin, authLoading, hasFetchedQuestions, toast]);

  // Fetch resources when user is authenticated and not loading
  useEffect(() => {
    if (authLoading || !user || hasFetchedResources) {
      console.log('🔄 Skipping resources fetch:', { authLoading, hasUser: !!user, hasFetchedResources });
      return;
    }

    const fetchResources = async () => {
      try {
        console.log('📥 Fetching resources...');
        setResourcesLoading(true);
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('❌ Error fetching resources:', error);
          throw error;
        }
        
        console.log('✅ Resources loaded:', data?.length || 0);
        setResources(data || []);
        setHasFetchedResources(true);
      } catch (error) {
        console.error('❌ Error fetching resources:', error);
      } finally {
        setResourcesLoading(false);
      }
    };

    fetchResources();
  }, [user, authLoading, hasFetchedResources]);

  // Filter questions
  useEffect(() => {
    let filtered = questions;

    if (searchTerm) {
      filtered = filtered.filter(q =>
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "All") {
      filtered = filtered.filter(q => q.category === categoryFilter);
    }

    if (difficultyFilter !== "All") {
      filtered = filtered.filter(q => q.difficulty === difficultyFilter);
    }

    if (interviewStageFilter !== "All") {
      filtered = filtered.filter(q => q.interview_stage === interviewStageFilter);
    }

    setFilteredQuestions(filtered);
  }, [questions, searchTerm, categoryFilter, difficultyFilter, interviewStageFilter]);

  const handleSubmitSuccess = () => {
    setDialogOpen(false);
    toast({
      title: "Question submitted!",
      description: "Your question has been submitted for review.",
    });
    // Refresh questions
    setHasFetchedQuestions(false);
  };

  const handleEdit = (question: InterviewQuestion) => {
    setEditingQuestion(question);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setEditingQuestion(null);
    toast({
      title: "Question updated!",
      description: "The question has been updated successfully.",
    });
    // Refresh questions
    setHasFetchedQuestions(false);
  };

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 leading-tight">
            Source Edge Interview Prep
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            Prepare for your upcoming interview by reviewing past interview questions and tips
          </p>
          
          {/* Quick Links Section */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/resources">
              <Button variant="outline" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Browse Resources
              </Button>
            </Link>
            <Link to="/track/1">
              <Button variant="outline" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                View Tracks
              </Button>
            </Link>
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Admin Dashboard
                </Button>
              </Link>
            )}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Share Your Experience
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Submit Interview Question</DialogTitle>
                </DialogHeader>
                <SubmitQuestionForm onSuccess={handleSubmitSuccess} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Resources Preview Section */}
        <div className="mb-12 bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Useful Resources</h2>
            <Link to="/resources">
              <Button variant="ghost" className="flex items-center gap-2">
                View All <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="text-gray-600 mb-4">
            Check out our curated collection of helpful resources for interview preparation and career development.
          </p>
          
          {resourcesLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading resources...</p>
            </div>
          ) : resources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {resources.slice(0, 10).map((resource) => (
                <div key={resource.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm line-clamp-2">{resource.title}</h3>
                    <Badge variant="secondary" className="ml-2 shrink-0 text-xs">
                      {resource.category}
                    </Badge>
                  </div>
                  {resource.description && (
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {resource.description}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(resource.url, '_blank')}
                    className="flex items-center gap-2 text-xs"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Visit
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Badge variant="secondary">Interview Prep</Badge>
              <Badge variant="secondary">Technical Skills</Badge>
              <Badge variant="secondary">System Design</Badge>
              <Badge variant="secondary">Career Development</Badge>
            </div>
          )}
        </div>

        {/* Questions Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Interview Questions</h2>
            <Input
              type="text"
              placeholder="Search questions..."
              className="max-w-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-4 mb-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map(difficulty => (
                  <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={interviewStageFilter} onValueChange={setInterviewStageFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Interview Stage" />
              </SelectTrigger>
              <SelectContent>
                {interviewStages.map(stage => (
                  <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Error Alert */}
          {questionsError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{questionsError}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {questionsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading questions...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuestions.map(question => (
                <QuestionCard
                  key={question.id}
                  question={question}
                />
              ))}
            </div>
          )}

          {/* No Questions State */}
          {!questionsLoading && filteredQuestions.length === 0 && !questionsError && (
            <div className="text-center py-12">
              <p className="text-gray-600">No questions found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Interview Question</DialogTitle>
            </DialogHeader>
            {editingQuestion && (
              <EditQuestionForm
                question={editingQuestion}
                onSuccess={handleEditSuccess}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;
