
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('interview_questions')
        .update({
          question: formData.question,
          company: formData.company,
          role: formData.role,
          category: formData.category,
          interview_stage: formData.interview_stage,
          additional_context: formData.additional_context || null,
          team: formData.team || null,
          position_name: formData.position_name || null,
        })
        .eq('id', question.id);

      if (error) throw error;

      toast({
        title: "Question updated!",
        description: "The question has been updated successfully.",
      });

      onSuccess();
    } catch (error) {
      console.error('Error updating question:', error);
      toast({
        title: "Error",
        description: "Failed to update question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
          <Input
            id="company"
            placeholder="e.g., Google, Microsoft"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            required
          />
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
              <SelectItem value="SRE/DevOps">SRE/DevOps</SelectItem>
              <SelectItem value="Engineering Manager">Engineering Manager</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="team">Team</Label>
          <Select value={formData.team} onValueChange={(value) => setFormData({ ...formData, team: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select team (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cloud & AI">Cloud & AI</SelectItem>
              <SelectItem value="Enterprise Technology">Enterprise Technology</SelectItem>
              <SelectItem value="Dojo">Dojo</SelectItem>
            </SelectContent>
          </Select>
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
              <SelectItem value="Phone Screen">Phone Screen</SelectItem>
              <SelectItem value="Technical">Technical</SelectItem>
              <SelectItem value="Onsite">Onsite</SelectItem>
              <SelectItem value="Final">Final</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="additional_context">Additional Context</Label>
        <Textarea
          id="additional_context"
          placeholder="Any additional context about the question, difficulty, or experience..."
          value={formData.additional_context}
          onChange={(e) => setFormData({ ...formData, additional_context: e.target.value })}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Updating..." : "Update Question"}
      </Button>
    </form>
  );
};
