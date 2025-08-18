
// ABOUTME: Form component for submitting interview questions with validation and security
// ABOUTME: Includes rich text editor for additional context and handles admin vs user submissions
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { validateQuestionInput, validateCompanyInput, validateRoleInput, sanitizeTextInput, checkRateLimit } from "@/utils/inputSecurity";
import { logInvalidInput, logRateLimitExceeded } from "@/utils/securityLogger";

interface SubmitQuestionFormProps {
  onSuccess: () => void;
}

export const SubmitQuestionForm = ({ onSuccess }: SubmitQuestionFormProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Validate question
    const questionValidation = validateQuestionInput(formData.question);
    if (!questionValidation.isValid) {
      errors.question = questionValidation.message || "Invalid question";
      logInvalidInput(`Question validation failed: ${questionValidation.message}`, user?.id);
    }
    
    // Validate company
    const companyValidation = validateCompanyInput(formData.company);
    if (!companyValidation.isValid) {
      errors.company = companyValidation.message || "Invalid company";
      logInvalidInput(`Company validation failed: ${companyValidation.message}`, user?.id);
    }
    
    // Validate role
    const roleValidation = validateRoleInput(formData.role);
    if (!roleValidation.isValid) {
      errors.role = roleValidation.message || "Invalid role";
      logInvalidInput(`Role validation failed: ${roleValidation.message}`, user?.id);
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitQuestionMutation = useMutation({
    mutationFn: async (questionData: any) => {
      console.log('📝 Submitting question...');
      console.log('User:', user?.email);
      console.log('Profile:', profile);
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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['all-questions-for-stage'] });
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
      setValidationErrors({});

      onSuccess();
    },
    onError: (error: any) => {
      console.error('❌ Error submitting question:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit question. Please try again.",
        variant: "destructive",
      });
    },
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

    // Check rate limiting
    const rateLimitKey = `submit_question_${user.id}`;
    if (!checkRateLimit(rateLimitKey, 5, 300000)) { // 5 requests per 5 minutes
      logRateLimitExceeded(`Question submission rate limit exceeded`, user.id);
      toast({
        title: "Rate limit exceeded",
        description: "You're submitting questions too quickly. Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    // Validate form
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form.",
        variant: "destructive",
      });
      return;
    }

    // Sanitize inputs before submission - note: additional_context is now HTML from rich text editor
    const questionData = {
      question: sanitizeTextInput(formData.question),
      company: sanitizeTextInput(formData.company),
      role: sanitizeTextInput(formData.role),
      category: sanitizeTextInput(formData.category),
      interview_stage: sanitizeTextInput(formData.interview_stage),
      additional_context: formData.additional_context.trim() ? formData.additional_context : null,
      team: formData.team ? sanitizeTextInput(formData.team) : null,
      position_name: formData.position_name.trim() ? sanitizeTextInput(formData.position_name) : null,
      submitted_by: profile?.email || user.email,
      question_type: 'user_submitted',
      status: profile?.role === 'admin' ? 'approved' : 'pending',
    };

    submitQuestionMutation.mutate(questionData);
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
          className={validationErrors.question ? "border-red-500" : ""}
        />
        {validationErrors.question && (
          <p className="text-sm text-red-600">{validationErrors.question}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company">Company *</Label>
          <Select 
            value={formData.company} 
            onValueChange={(value) => setFormData({ ...formData, company: value })}
          >
            <SelectTrigger className={validationErrors.company ? "border-red-500" : ""}>
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Woven by Toyota">Woven by Toyota</SelectItem>
              <SelectItem value="LexxPluss">LexxPluss</SelectItem>
              <SelectItem value="Wismettac">Wismettac</SelectItem>
            </SelectContent>
          </Select>
          {validationErrors.company && (
            <p className="text-sm text-red-600">{validationErrors.company}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Select 
            value={formData.role} 
            onValueChange={(value) => setFormData({ ...formData, role: value })}
          >
            <SelectTrigger className={validationErrors.role ? "border-red-500" : ""}>
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
          {validationErrors.role && (
            <p className="text-sm text-red-600">{validationErrors.role}</p>
          )}
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
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="position_name">Position Name</Label>
          <Input
            id="position_name"
            placeholder="e.g., Senior Software Engineer (optional)"
            value={formData.position_name}
            onChange={(e) => setFormData({ ...formData, position_name: e.target.value })}
            maxLength={100}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="additional_context">Additional Context</Label>
        <div className="min-h-[200px]">
          <RichTextEditor
            value={formData.additional_context}
            onChange={(value) => setFormData({ ...formData, additional_context: value })}
            placeholder="Add any additional information regarding the interview question (eg. tips, detailed information, and more)."
          />
        </div>
      </div>

      <Button 
        type="submit" 
        variant="gradient"
        className="w-full"
        disabled={submitQuestionMutation.isPending}
      >
        {submitQuestionMutation.isPending ? "Submitting..." : "Submit Question"}
      </Button>
      
      <p className="text-xs text-gray-500 text-center">
        * Required fields. {profile?.role === 'admin' ? 'Questions will be published immediately.' : 'Questions will be reviewed before publishing.'}
      </p>
    </form>
  );
};
