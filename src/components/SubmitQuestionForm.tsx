
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface SubmitQuestionFormProps {
  onSuccess: () => void;
}

export const SubmitQuestionForm = ({ onSuccess }: SubmitQuestionFormProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    question: "",
    company: "",
    role: "",
    category: "",
    interview_stage: "",
    additional_context: "",
    team: "",
    position_name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit questions.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Submitting question with user ID:', user.id);
      console.log('User profile:', profile);
      console.log('Form data before submission:', formData);
      
      const { error } = await supabase
        .from('interview_questions')
        .insert({
          question: formData.question,
          company: formData.company,
          role: formData.role,
          category: formData.category || 'Technical',
          interview_stage: formData.interview_stage || 'Technical Interview',
          additional_context: formData.additional_context,
          team: formData.team || null,
          position_name: formData.position_name || null,
          submitted_by: profile?.email || user.email,
          question_type: 'user_submitted',
          status: profile?.role === 'admin' ? 'approved' : 'pending',
        });

      if (error) {
        console.error('Error submitting question:', error);
        throw error;
      }

      toast({
        title: "Question submitted!",
        description: profile?.role === 'admin' 
          ? "Your question has been published immediately."
          : "Your question has been submitted for review and will appear once approved.",
      });

      setFormData({
        question: "",
        company: "",
        role: "",
        category: "",
        interview_stage: "",
        additional_context: "",
        team: "",
        position_name: "",
      });

      onSuccess();
    } catch (error) {
      console.error('Error submitting question:', error);
      toast({
        title: "Error",
        description: "Failed to submit question. Please try again.",
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
              <SelectItem value="HR Screen">HR Screen</SelectItem>
              <SelectItem value="Technical Interview">Technical Interview</SelectItem>
              <SelectItem value="Cross-Functional">Cross-Functional</SelectItem>
              <SelectItem value="Final Interview">Final Interview</SelectItem>
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
        {isSubmitting ? "Submitting..." : "Submit Question"}
      </Button>
    </form>
  );
};
