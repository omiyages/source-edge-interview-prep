
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormattedTextarea } from "@/components/ui/formatted-textarea";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface InterviewQuestion {
  id: string;
  question: string;
  company: string;
  role: string;
  interview_stage: string;
  category: string;
  additional_context: string | null;
  team: string | null;
  position_name: string | null;
}

interface EditQuestionFormProps {
  question: InterviewQuestion;
  onSuccess: () => void;
}

export const EditQuestionForm = ({ question, onSuccess }: EditQuestionFormProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    question: question.question,
    company: question.company,
    role: question.role,
    category: question.category,
    interview_stage: question.interview_stage,
    additional_context: question.additional_context || "",
    team: question.team || "",
    position_name: question.position_name || "",
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (questionData: typeof formData) => {
      const { error } = await supabase
        .from('interview_questions')
        .update({
          question: questionData.question,
          company: questionData.company,
          role: questionData.role,
          category: questionData.category,
          interview_stage: questionData.interview_stage,
          additional_context: questionData.additional_context || null,
          team: questionData.team || null,
          position_name: questionData.position_name || null,
        })
        .eq('id', question.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['all-questions-for-stage'] });
      toast({
        title: "Question updated!",
        description: "The question has been updated successfully.",
      });
      onSuccess();
    },
    onError: (error) => {
      console.error('Error updating question:', error);
      toast({
        title: "Error",
        description: "Failed to update question. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateQuestionMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="question">Interview Question *</Label>
        <Textarea
          id="question"
          placeholder="Enter the interview question..."
          value={formData.question}
          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
          required
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company">Company *</Label>
          <Select value={formData.company} onValueChange={(value) => setFormData({ ...formData, company: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Woven by Toyota">Woven by Toyota</SelectItem>
              <SelectItem value="LexxPluss">LexxPluss</SelectItem>
              <SelectItem value="Wismettac">Wismettac</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select role type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Backend Engineer">Backend Engineer</SelectItem>
              <SelectItem value="Frontend Engineer">Frontend Engineer</SelectItem>
              <SelectItem value="Full Stack Engineer">Full Stack Engineer</SelectItem>
              <SelectItem value="SRE/DevOps">SRE/DevOps</SelectItem>
              <SelectItem value="Engineering Manager">Engineering Manager</SelectItem>
              <SelectItem value="Product Manager">Product Manager</SelectItem>
              <SelectItem value="Data Engineer">Data Engineer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Technical">Technical</SelectItem>
              <SelectItem value="Behavioral">Behavioral</SelectItem>
              <SelectItem value="System Design">System Design</SelectItem>
              <SelectItem value="Background">Background</SelectItem>
              <SelectItem value="Culture Fit">Culture Fit</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="interview_stage">Interview Stage</Label>
          <Select value={formData.interview_stage} onValueChange={(value) => setFormData({ ...formData, interview_stage: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HR Screen">HR Screen</SelectItem>
              <SelectItem value="Technical Interview">Technical Interview</SelectItem>
              <SelectItem value="Cross-Functional">Cross-Functional</SelectItem>
              <SelectItem value="Final Interview">Final Interview</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="team">Team</Label>
          <Input
            id="team"
            placeholder="e.g., Cloud & AI (optional)"
            value={formData.team}
            onChange={(e) => setFormData({ ...formData, team: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="position_name">Position Name</Label>
          <Input
            id="position_name"
            placeholder="e.g., Senior Software Engineer (optional)"
            value={formData.position_name}
            onChange={(e) => setFormData({ ...formData, position_name: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="additional_context">Additional Context</Label>
        <FormattedTextarea
          id="additional_context"
          placeholder="Any additional context about the question, difficulty, or experience...&#10;&#10;You can use **bold text** for emphasis and preserve line breaks and spacing when copying text."
          value={formData.additional_context}
          onChange={(e) => setFormData({ ...formData, additional_context: e.target.value })}
          rows={4}
          showPreview={true}
        />
      </div>

      <Button type="submit" className="w-full" disabled={updateQuestionMutation.isPending}>
        {updateQuestionMutation.isPending ? "Updating..." : "Update Question"}
      </Button>
    </form>
  );
};
