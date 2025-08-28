
// ABOUTME: Form component for submitting new interview questions with rich text support
// ABOUTME: Allows users to submit questions with images and code snippets in additional context

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export const SubmitQuestionForm = () => {
  const [formData, setFormData] = useState({
    question: "",
    company: "",
    role: "",
    interview_stage: "",
    category: "",
    additional_context: "",
    question_type: "Technical",
  });

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const submitQuestionMutation = useMutation({
    mutationFn: async (questionData: any) => {
      console.log('Submitting question data:', questionData);
      
      const { data, error } = await supabase
        .from('interview_questions')
        .insert([{
          ...questionData,
          submitted_by: user?.email,
          status: 'pending'
        }])
        .select();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Question submitted successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-questions'] });
      toast({
        title: "Question Submitted",
        description: "Your question has been submitted for review.",
      });
      // Reset form
      setFormData({
        question: "",
        company: "",
        role: "",
        interview_stage: "",
        category: "",
        additional_context: "",
        question_type: "Technical",
      });
    },
    onError: (error: any) => {
      console.error('Submit question error:', error);
      toast({
        title: "Error",
        description: `Failed to submit question: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    submitQuestionMutation.mutate(formData);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Submit Interview Question</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="question">Question *</Label>
            <Input
              id="question"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="Enter the interview question..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g., Google, Meta, Amazon"
                required
              />
            </div>

            <div>
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Frontend Engineer">Frontend Engineer</SelectItem>
                  <SelectItem value="Backend Engineer">Backend Engineer</SelectItem>
                  <SelectItem value="Full Stack Engineer">Full Stack Engineer</SelectItem>
                  <SelectItem value="Engineering Manager">Engineering Manager</SelectItem>
                  <SelectItem value="SRE/DevOps">SRE/DevOps</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="System Design">System Design</SelectItem>
                  <SelectItem value="Coding">Coding</SelectItem>
                  <SelectItem value="Behavioral">Behavioral</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="interview_stage">Interview Stage *</Label>
              <Select value={formData.interview_stage} onValueChange={(value) => setFormData({ ...formData, interview_stage: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Phone Screen">Phone Screen</SelectItem>
                  <SelectItem value="Technical Screen">Technical Screen</SelectItem>
                  <SelectItem value="On-site">On-site</SelectItem>
                  <SelectItem value="Final Round">Final Round</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="additional_context">Additional Context</Label>
            <RichTextEditor
              value={formData.additional_context}
              onChange={(value) => setFormData({ ...formData, additional_context: value })}
              placeholder="Add any additional context, images, code snippets, or helpful information..."
              className="min-h-[150px]"
              enableImagePaste={true}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={submitQuestionMutation.isPending}
          >
            {submitQuestionMutation.isPending ? "Submitting..." : "Submit Question"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
