
// ABOUTME: Form component for editing interview questions with rich text support
// ABOUTME: Provides comprehensive question editing with image and code snippet capabilities

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";

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
  status?: string;
  team: string | null;
  position_name: string | null;
  recommended?: boolean;
}

interface EditQuestionFormProps {
  question: InterviewQuestion;
  onSuccess: () => void;
}

export const EditQuestionForm = ({ question, onSuccess }: EditQuestionFormProps) => {
  const [formData, setFormData] = useState({
    question: question.question,
    company: question.company,
    role: question.role,
    interview_stage: question.interview_stage,
    category: question.category,
    additional_context: question.additional_context || "",
    question_type: question.question_type,
    source_url: question.source_url || "",
    source_website: question.source_website || "",
    team: question.team || "",
    position_name: question.position_name || "",
    recommended: question.recommended || false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateQuestionMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const { error } = await supabase
        .from('interview_questions')
        .update(updatedData)
        .eq('id', question.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-questions'] });
      toast({
        title: "Question Updated",
        description: "The question has been successfully updated.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update question: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuestionMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="question">Question</Label>
        <Input
          id="question"
          value={formData.question}
          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="role">Role</Label>
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
          <Label htmlFor="category">Category</Label>
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
          <Label htmlFor="interview_stage">Interview Stage</Label>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="team">Team</Label>
          <Input
            id="team"
            value={formData.team}
            onChange={(e) => setFormData({ ...formData, team: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="position_name">Position Name</Label>
          <Input
            id="position_name"
            value={formData.position_name}
            onChange={(e) => setFormData({ ...formData, position_name: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="source_website">Source Website</Label>
          <Input
            id="source_website"
            value={formData.source_website}
            onChange={(e) => setFormData({ ...formData, source_website: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="source_url">Source URL</Label>
          <Input
            id="source_url"
            value={formData.source_url}
            onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="additional_context">Additional Context</Label>
        <RichTextEditor
          value={formData.additional_context}
          onChange={(value) => setFormData({ ...formData, additional_context: value })}
          placeholder="Add any additional context, images, or code snippets..."
          className="min-h-[200px]"
          enableImagePaste={true}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="recommended"
          checked={formData.recommended}
          onCheckedChange={(checked) => setFormData({ ...formData, recommended: checked as boolean })}
        />
        <Label htmlFor="recommended" className="text-sm font-medium">
          Mark as featured question
        </Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={updateQuestionMutation.isPending}>
          {updateQuestionMutation.isPending ? "Updating..." : "Update Question"}
        </Button>
      </div>
    </form>
  );
};
