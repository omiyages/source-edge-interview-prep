
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
import { Plus, Search, Filter, BookOpen, ExternalLink, Settings, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

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

const Index = () => {
  const { user, profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<InterviewQuestion[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [interviewStageFilter, setInterviewStageFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<InterviewQuestion | null>(null);
  const [loading, setLoading] = useState(true);

  const categories = ["All", "Technical", "Behavioral", "System Design", "Background", "Culture Fit", "Other"];
  const difficulties = ["All", "Easy", "Medium", "Hard"];
  const interviewStages = ["All", "Phone Screen", "Technical", "Onsite", "Final", "Other"];

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('interview_questions')
          .select('*')
          .order('created_at', { ascending: false });

        if (profile?.role !== 'admin') {
          query = query.not('status', 'eq', 'pending');
        }

        const { data, error } = await query;

        if (error) throw error;

        setQuestions(data || []);
      } catch (error) {
        console.error('Error fetching questions:', error);
        toast({
          title: "Error",
          description: "Failed to load questions.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [profile]);

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
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            InterviewAce
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Badge variant="secondary">Interview Prep</Badge>
            <Badge variant="secondary">Technical Skills</Badge>
            <Badge variant="secondary">System Design</Badge>
            <Badge variant="secondary">Career Development</Badge>
          </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuestions.map(question => (
              <QuestionCard
                key={question.id}
                question={question}
              />
            ))}
          </div>
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
          </Dialog>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;
