
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Building2, Briefcase, Star, Clock, Globe, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubmitQuestionForm } from "@/components/SubmitQuestionForm";
import { ScrapeQuestionsForm } from "@/components/ScrapeQuestionsForm";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [questionTypeFilter, setQuestionTypeFilter] = useState("all");
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

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
  });

  const filteredQuestions = questions?.filter(question => {
    const matchesSearch = question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = companyFilter === "all" || question.company === companyFilter;
    const matchesDifficulty = difficultyFilter === "all" || question.difficulty === difficultyFilter;
    const matchesCategory = categoryFilter === "all" || question.category === categoryFilter;
    const matchesType = questionTypeFilter === "all" || question.question_type === questionTypeFilter;
    
    return matchesSearch && matchesCompany && matchesDifficulty && matchesCategory && matchesType;
  });

  const uniqueCompanies = [...new Set(questions?.map(q => q.company) || [])];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Technical': return <Star className="w-4 h-4" />;
      case 'Behavioral': return <Briefcase className="w-4 h-4" />;
      case 'System Design': return <Building2 className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    return type === 'online_sourced' ? <Globe className="w-4 h-4" /> : <User className="w-4 h-4" />;
  };

  const getQuestionTypeColor = (type: string) => {
    return type === 'online_sourced' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Interview Questions Directory
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Browse real interview questions from top companies. Learn from others' experiences and contribute your own.
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
            
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {uniqueCompanies.map(company => (
                  <SelectItem key={company} value={company}>{company}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Difficulties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
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
              <Card key={question.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getCategoryIcon(question.category)}
                      <span className="text-sm font-medium text-gray-600 truncate">
                        {question.category}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getDifficultyColor(question.difficulty)}>
                        {question.difficulty}
                      </Badge>
                      <Badge className={getQuestionTypeColor(question.question_type)}>
                        <div className="flex items-center gap-1">
                          {getQuestionTypeIcon(question.question_type)}
                          <span className="text-xs">
                            {question.question_type === 'online_sourced' ? 'Sourced' : 'User'}
                          </span>
                        </div>
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-lg leading-tight">
                    {question.question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-gray-900">{question.company}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{question.role}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">{question.interview_stage}</span>
                    </div>
                    
                    {question.source_url && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <a 
                          href={question.source_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate"
                        >
                          {question.source_website}
                        </a>
                      </div>
                    )}
                    
                    {question.additional_context && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">
                          {question.additional_context}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t">
                      <span>By {question.submitted_by || 'Anonymous'}</span>
                      <span>{new Date(question.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
