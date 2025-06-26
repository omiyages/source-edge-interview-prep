
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
      console.log('Form data:', formData);
      
      const { error } = await supabase
        .from('interview_questions')
        .insert({
          question: formData.question,
          company: formData.company,
          role: formData.role,
          category: formData.category || 'technical',
          interview_stage: formData.interview_stage || 'technical',
          additional_context: formData.additional_context,
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
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="behavioral">Behavioral</SelectItem>
              <SelectItem value="system_design">System Design</SelectItem>
              <SelectItem value="problem_solving">Problem Solving</SelectItem>
              <SelectItem value="culture_fit">Culture Fit</SelectItem>
              <SelectItem value="other">Other</SelectItem>
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
              <SelectItem value="phone_screen">Phone Screen</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="onsite">Onsite</SelectItem>
              <SelectItem value="final">Final</SelectItem>
              <SelectItem value="other">Other</SelectItem>
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
