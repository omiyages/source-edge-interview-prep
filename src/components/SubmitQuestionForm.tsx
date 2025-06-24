
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface SubmitQuestionFormProps {
  onSuccess: () => void;
}

export const SubmitQuestionForm = ({ onSuccess }: SubmitQuestionFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    question: "",
    company: "",
    role: "",
    difficulty: "Medium",
    interview_stage: "Technical",
    category: "Technical",
    submitted_by: "",
    additional_context: ""
  });
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question.trim() || !formData.company.trim() || !formData.role.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in the question, company, and role fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('interview_questions')
        .insert([{
          question: formData.question.trim(),
          company: formData.company.trim(),
          role: formData.role.trim(),
          difficulty: formData.difficulty,
          interview_stage: formData.interview_stage,
          category: formData.category,
          submitted_by: formData.submitted_by.trim() || null,
          additional_context: formData.additional_context.trim() || null
        }]);

      if (error) throw error;

      toast({
        title: "Question submitted!",
        description: "Thank you for contributing to the community.",
      });

      // Reset form
      setFormData({
        question: "",
        company: "",
        role: "",
        difficulty: "Medium",
        interview_stage: "Technical",
        category: "Technical",
        submitted_by: "",
        additional_context: ""
      });

      onSuccess();
    } catch (error) {
      console.error('Error submitting question:', error);
      toast({
        title: "Error submitting question",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4">
        <div>
          <Label htmlFor="question" className="text-sm font-medium">
            Interview Question *
          </Label>
          <Textarea
            id="question"
            placeholder="What was the interview question you were asked?"
            value={formData.question}
            onChange={(e) => handleChange('question', e.target.value)}
            className="mt-1 min-h-[100px]"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company" className="text-sm font-medium">
              Company *
            </Label>
            <Input
              id="company"
              placeholder="e.g., Google, Microsoft, Amazon"
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="role" className="text-sm font-medium">
              Role *
            </Label>
            <Input
              id="role"
              placeholder="e.g., Software Engineer, Product Manager"
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className="mt-1"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium">Difficulty</Label>
            <Select value={formData.difficulty} onValueChange={(value) => handleChange('difficulty', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Interview Stage</Label>
            <Select value={formData.interview_stage} onValueChange={(value) => handleChange('interview_stage', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Phone Screen">Phone Screen</SelectItem>
                <SelectItem value="Technical">Technical</SelectItem>
                <SelectItem value="Behavioral">Behavioral</SelectItem>
                <SelectItem value="System Design">System Design</SelectItem>
                <SelectItem value="Final Round">Final Round</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Category</Label>
            <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Technical">Technical</SelectItem>
                <SelectItem value="Behavioral">Behavioral</SelectItem>
                <SelectItem value="System Design">System Design</SelectItem>
                <SelectItem value="Problem Solving">Problem Solving</SelectItem>
                <SelectItem value="Culture Fit">Culture Fit</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="submitted_by" className="text-sm font-medium">
            Your Name (Optional)
          </Label>
          <Input
            id="submitted_by"
            placeholder="Leave blank to remain anonymous"
            value={formData.submitted_by}
            onChange={(e) => handleChange('submitted_by', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="additional_context" className="text-sm font-medium">
            Additional Context (Optional)
          </Label>
          <Textarea
            id="additional_context"
            placeholder="Any additional details about the question, time constraints, follow-up questions, etc."
            value={formData.additional_context}
            onChange={(e) => handleChange('additional_context', e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? "Submitting..." : "Submit Question"}
        </Button>
      </div>
    </form>
  );
};
