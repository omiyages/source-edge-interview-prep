
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const CSVImportForm = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const importQuestionsMutation = useMutation({
    mutationFn: async (questions: any[]) => {
      const questionsToInsert = questions.map(q => ({
        question: q.interview_question,
        company: q.company,
        role: q.role,
        category: q.category || 'Technical',
        interview_stage: q.interview_stage || 'Technical Interview',
        additional_context: q.additional_context || null,
        submitted_by: profile?.email || user?.email,
        question_type: 'admin_imported',
        status: 'approved', // Admin imports are auto-approved
      }));

      const { error } = await supabase
        .from('interview_questions')
        .insert(questionsToInsert);

      if (error) throw error;
      return questionsToInsert.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['interview-questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-questions'] });
      
      toast({
        title: "Import Successful",
        description: `Successfully imported ${count} questions.`,
      });
      
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('csv-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: "Failed to import questions. Please check the CSV format.",
        variant: "destructive",
      });
    },
  });

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const questions = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const question: any = {};
        headers.forEach((header, index) => {
          question[header] = values[index];
        });
        questions.push(question);
      }
    }

    return questions;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid CSV file.",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const questions = parseCSV(text);
      
      if (questions.length === 0) {
        toast({
          title: "No Data",
          description: "No valid questions found in the CSV file.",
          variant: "destructive",
        });
        return;
      }

      // Validate required fields
      const invalidQuestions = questions.filter(q => 
        !q.interview_question || !q.company || !q.role
      );

      if (invalidQuestions.length > 0) {
        toast({
          title: "Invalid Data",
          description: "Some questions are missing required fields (interview_question, company, role).",
          variant: "destructive",
        });
        return;
      }

      importQuestionsMutation.mutate(questions);
    } catch (error) {
      toast({
        title: "Parse Error",
        description: "Failed to parse CSV file. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `interview_question,company,role,category,interview_stage,additional_context
"What is your experience with React?","Woven by Toyota","Frontend Engineer","Technical","Technical Interview","Focus on hooks and state management"
"Describe a challenging project you worked on","LexxPluss","Backend Engineer","Behavioral","HR Screen","Look for problem-solving skills"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interview_questions_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Bulk Import Questions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="csv-file">Upload CSV File</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={importing}
          />
          <p className="text-sm text-gray-600">
            CSV should have headers: interview_question, company, role, category, interview_stage, additional_context
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleImport}
            disabled={!file || importing || importQuestionsMutation.isPending}
            className="flex-1"
          >
            {importing || importQuestionsMutation.isPending ? "Importing..." : "Import Questions"}
          </Button>
          
          <Button
            variant="outline"
            onClick={downloadTemplate}
            disabled={importing}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
