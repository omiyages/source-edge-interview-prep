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
    category: "Technical",
    interview_stage: "Technical Interview",
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

    if (!formData.question.trim() || !formData.company || !formData.role) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields (Question, Company, Role).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📝 Submitting question...');
      console.log('User:', user.email);
      console.log('Profile:', profile);
      
      const questionData = {
        question: formData.question.trim(),
        company: formData.company,
        role: formData.role,
        category: formData.category,
        interview_stage: formData.interview_stage,
        additional_context: formData.additional_context.trim() || null,
        team: formData.team || null,
        position_name: formData.position_name.trim() || null,
        submitted_by: profile?.email || user.email,
        question_type: 'user_submitted',
        status: profile?.role === 'admin' ? 'approved' : 'pending',
      };

      console.log('Question data:', questionData);
      
      const { data, error } = await supabase
        .from('interview_questions')
        .insert(questionData)
        .select();

      if (error) {
        console.error('❌ Error submitting question:', error);
        throw error;
      }

      console.log('✅ Question submitted successfully:', data);

      toast({
        title: "Question submitted!",
        description: profile?.role === 'admin' 
          ? "Your question has been published immediately."
          : "Your question has been submitted for review and will appear once approved.",
      });

      // Reset form
      setFormData({
        question: "",
        company: "",
        role: "",
        category: "Technical",
        interview_stage: "Technical Interview",
        additional_context: "",
        team: "",
        position_name: "",
      });

      onSuccess();
    } catch (error: any) {
      console.error('❌ Error submitting question:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit question. Please try again.",
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
        <Textarea
          id="additional_context"
          placeholder="Any additional context about the question, difficulty, or experience..."
          value={formData.additional_context}
          onChange={(e) => setFormData({ ...formData, additional_context: e.target.value })}
          rows={3}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full bg-purple-gradient hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 transition-all duration-300 text-white font-medium" 
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Submit Question"}
      </Button>
      
      <p className="text-xs text-gray-500 text-center">
        * Required fields. {profile?.role === 'admin' ? 'Questions will be published immediately.' : 'Questions will be reviewed before publishing.'}
      </p>
    </form>
  );
};
