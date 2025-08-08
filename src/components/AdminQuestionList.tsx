
// ABOUTME: Admin component for viewing and managing all interview questions with filtering
// ABOUTME: Includes edit/delete functionality and status management for administrators

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EditQuestionForm } from "./EditQuestionForm";
import type { InterviewQuestion } from "@/services/questionsService";

interface AdminQuestionListProps {
  statusFilter?: "all" | "pending" | "approved";
}

export const AdminQuestionList = ({ statusFilter = "all" }: AdminQuestionListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [editingQuestion, setEditingQuestion] = useState<InterviewQuestion | null>(null);

  // Fetch questions based on status filter
  const { data: questions, isLoading } = useQuery({
    queryKey: ['admin-questions', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('interview_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter === "pending") {
        query = query.eq('status', 'pending');
      } else if (statusFilter === "approved") {
        query = query.eq('status', 'approved');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InterviewQuestion[];
    },
  });

  const filteredQuestions = questions?.filter(question => {
    const matchesSearch = question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCompany = !companyFilter || question.company === companyFilter;
    
    return matchesSearch && matchesCompany;
  });

  const handleApprove = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('interview_questions')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', questionId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
      toast({
        title: "Question approved!",
        description: "The question has been approved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve question. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const { error } = await supabase
        .from('interview_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
      toast({
        title: "Question deleted!",
        description: "The question has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUniqueCompanies = () => {
    if (!questions) return [];
    return [...new Set(questions.map(q => q.company))].filter(Boolean).sort();
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading questions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All companies</SelectItem>
            {getUniqueCompanies().map(company => (
              <SelectItem key={company} value={company}>{company}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-600">
        {filteredQuestions?.length || 0} question(s) found
      </p>

      {/* Questions list */}
      <div className="space-y-4">
        {filteredQuestions?.map((question) => (
          <Card key={question.id} className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base font-medium mb-2">
                    {question.question}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{question.company}</Badge>
                    <Badge variant="outline">{question.role}</Badge>
                    <Badge variant="outline">{question.category}</Badge>
                    <Badge variant="outline">{question.interview_stage}</Badge>
                    <Badge 
                      variant={question.status === 'approved' ? 'default' : 'destructive'}
                    >
                      {question.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {question.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprove(question.id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  )}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingQuestion(question)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Question</DialogTitle>
                      </DialogHeader>
                      {editingQuestion && (
                        <EditQuestionForm
                          question={editingQuestion}
                          onSuccess={() => setEditingQuestion(null)}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(question.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            {(question.additional_context || question.team || question.position_name) && (
              <CardContent className="pt-0">
                {question.additional_context && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">Additional Context:</p>
                    <p className="text-sm text-gray-600">{question.additional_context}</p>
                  </div>
                )}
                {(question.team || question.position_name) && (
                  <div className="flex gap-4 text-sm text-gray-600">
                    {question.team && <span><strong>Team:</strong> {question.team}</span>}
                    {question.position_name && <span><strong>Position:</strong> {question.position_name}</span>}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}

        {filteredQuestions?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No questions found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};
