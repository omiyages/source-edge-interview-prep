
// ABOUTME: Form component for submitting new interview questions with validation and security features
// ABOUTME: Includes admin functionality to add new dropdown options dynamically with database persistence

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { validateQuestionInput, validateCompanyInput, validateRoleInput, sanitizeTextInput, checkRateLimit } from "@/utils/inputSecurity";
import { logInvalidInput, logRateLimitExceeded } from "@/utils/securityLogger";
import { Plus } from "lucide-react";

interface SubmitQuestionFormProps {
  onSuccess: () => void;
}

export const SubmitQuestionForm = ({ onSuccess }: SubmitQuestionFormProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = profile?.role === 'admin';
  
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
  const [customInputs, setCustomInputs] = useState({
    showCompanyInput: false,
    showRoleInput: false,
    showCategoryInput: false,
    showStageInput: false,
  });

  const [customValues, setCustomValues] = useState({
    newCompany: "",
    newRole: "",
    newCategory: "",
    newStage: "",
  });

  // Fetch dynamic dropdown options from the new dropdown_options table
  const { data: dropdownOptions, refetch: refetchOptions } = useQuery({
    queryKey: ['dropdown-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dropdown_options')
        .select('field_name, value')
        .order('value');
      
      if (error) throw error;

      const companies = data?.filter(item => item.field_name === 'company').map(item => item.value).sort() || [];
      const roles = data?.filter(item => item.field_name === 'role').map(item => item.value).sort() || [];
      const categories = data?.filter(item => item.field_name === 'category').map(item => item.value).sort() || [];
      const interviewStages = data?.filter(item => item.field_name === 'interview_stage').map(item => item.value).sort() || [];

      return {
        companies,
        roles,
        categories,
        interviewStages
      };
    },
  });

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

  const addCustomOptionMutation = useMutation({
    mutationFn: async ({ field, value }: { field: string; value: string }) => {
      console.log('🔧 Adding custom option:', { field, value });
      
      const { data, error } = await supabase
        .from('dropdown_options')
        .insert({
          field_name: field,
          value: value.trim(),
          created_by: user?.id
        })
        .select();

      if (error) {
        console.error('❌ Error adding custom option:', error);
        throw error;
      }

      console.log('✅ Custom option added successfully:', data);
      return value;
    },
    onSuccess: (value, { field }) => {
      console.log('✅ Custom option mutation successful:', { field, value });
      
      // Update form data and close custom input
      setFormData(prev => ({ ...prev, [field]: value }));
      setCustomInputs(prev => ({ 
        ...prev, 
        [`show${field.charAt(0).toUpperCase() + field.slice(1)}Input`]: false 
      }));
      setCustomValues(prev => ({ 
        ...prev, 
        [`new${field.charAt(0).toUpperCase() + field.slice(1)}`]: "" 
      }));
      
      // Refetch options to update dropdowns
      refetchOptions();
      
      toast({
        title: "Option added",
        description: `${field.charAt(0).toUpperCase() + field.slice(1)} "${value}" has been added successfully.`,
      });
    },
    onError: (error: any) => {
      console.error('❌ Error adding custom option:', error);
      
      let errorMessage = "Failed to add custom option. Please try again.";
      
      // Handle duplicate value error
      if (error.message?.includes('duplicate key') || error.code === '23505') {
        errorMessage = "This option already exists.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleCustomInput = (field: string, value: string) => {
    if (value.trim() && isAdmin) {
      console.log('🔄 Handling custom input:', { field, value });
      addCustomOptionMutation.mutate({ field, value: value.trim() });
    }
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
      queryClient.invalidateQueries({ queryKey: ['dropdown-options'] });
      
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
      setCustomInputs({
        showCompanyInput: false,
        showRoleInput: false,
        showCategoryInput: false,
        showStageInput: false,
      });
      setCustomValues({
        newCompany: "",
        newRole: "",
        newCategory: "",
        newStage: "",
      });

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
    if (!checkRateLimit(rateLimitKey, 5, 300000)) {
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

    // Sanitize inputs before submission
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
          {customInputs.showCompanyInput ? (
            <div className="flex gap-2">
              <Input
                placeholder="Enter new company name"
                value={customValues.newCompany}
                onChange={(e) => setCustomValues(prev => ({ ...prev, newCompany: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCustomInput('company', customValues.newCompany);
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => handleCustomInput('company', customValues.newCompany)}
                disabled={addCustomOptionMutation.isPending}
              >
                {addCustomOptionMutation.isPending ? "..." : "Add"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCustomInputs(prev => ({ ...prev, showCompanyInput: false }))}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select 
                value={formData.company} 
                onValueChange={(value) => setFormData({ ...formData, company: value })}
              >
                <SelectTrigger className={validationErrors.company ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {dropdownOptions?.companies?.map((company) => (
                    <SelectItem key={company} value={company}>{company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomInputs(prev => ({ ...prev, showCompanyInput: true }))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          {validationErrors.company && (
            <p className="text-sm text-red-600">{validationErrors.company}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          {customInputs.showRoleInput ? (
            <div className="flex gap-2">
              <Input
                placeholder="Enter new role"
                value={customValues.newRole}
                onChange={(e) => setCustomValues(prev => ({ ...prev, newRole: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCustomInput('role', customValues.newRole);
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => handleCustomInput('role', customValues.newRole)}
                disabled={addCustomOptionMutation.isPending}
              >
                {addCustomOptionMutation.isPending ? "..." : "Add"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCustomInputs(prev => ({ ...prev, showRoleInput: false }))}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className={validationErrors.role ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select role type" />
                </SelectTrigger>
                <SelectContent>
                  {dropdownOptions?.roles?.map((role) => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomInputs(prev => ({ ...prev, showRoleInput: true }))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          {validationErrors.role && (
            <p className="text-sm text-red-600">{validationErrors.role}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          {customInputs.showCategoryInput ? (
            <div className="flex gap-2">
              <Input
                placeholder="Enter new category"
                value={customValues.newCategory}
                onChange={(e) => setCustomValues(prev => ({ ...prev, newCategory: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCustomInput('category', customValues.newCategory);
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => handleCustomInput('category', customValues.newCategory)}
                disabled={addCustomOptionMutation.isPending}
              >
                {addCustomOptionMutation.isPending ? "..." : "Add"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCustomInputs(prev => ({ ...prev, showCategoryInput: false }))}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {dropdownOptions?.categories?.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomInputs(prev => ({ ...prev, showCategoryInput: true }))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="interview_stage">Interview Stage</Label>
          {customInputs.showStageInput ? (
            <div className="flex gap-2">
              <Input
                placeholder="Enter new interview stage"
                value={customValues.newStage}
                onChange={(e) => setCustomValues(prev => ({ ...prev, newStage: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCustomInput('interview_stage', customValues.newStage);
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => handleCustomInput('interview_stage', customValues.newStage)}
                disabled={addCustomOptionMutation.isPending}
              >
                {addCustomOptionMutation.isPending ? "..." : "Add"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCustomInputs(prev => ({ ...prev, showStageInput: false }))}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select value={formData.interview_stage} onValueChange={(value) => setFormData({ ...formData, interview_stage: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {dropdownOptions?.interviewStages?.map((stage) => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomInputs(prev => ({ ...prev, showStageInput: true }))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
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
        <div style={{ minHeight: '600px' }}>
          <RichTextEditor
            value={formData.additional_context}
            onChange={(value) => setFormData({ ...formData, additional_context: value })}
            placeholder="Add any additional information regarding the interview question (eg. tips, detailed information, and more)."
            className="min-h-[600px]"
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
