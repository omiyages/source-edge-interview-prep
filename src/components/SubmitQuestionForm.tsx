
// ABOUTME: Form component for submitting new interview questions with rich text support
// ABOUTME: Handles question creation with company, featured status, and rich additional context

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SubmitQuestionFormProps {
  onSuccess: () => void;
}

export const SubmitQuestionForm = ({ onSuccess }: SubmitQuestionFormProps) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [company, setCompany] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [role, setRole] = useState("");
  const [interviewStage, setInterviewStage] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a question.",
        variant: "destructive",
      });
      return;
    }

    if (!question.trim()) {
      toast({
        title: "Error", 
        description: "Please enter a question.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('interview_questions')
        .insert({
          question: question.trim(),
          company: company.trim() || 'Unknown',
          role: role.trim() || 'General',
          interview_stage: interviewStage || 'Technical',
          category: category || 'Technical',
          additional_context: additionalContext.trim() || null,
          recommended: isFeatured,
          submitted_by: user.email,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your question has been submitted for review.",
      });

      // Reset form
      setQuestion("");
      setAnswer("");
      setAdditionalContext("");
      setCompany("");
      setDifficulty("");
      setCategory("");
      setSubcategory("");
      setRole("");
      setInterviewStage("");
      setIsFeatured(false);
      
      onSuccess();
    } catch (error) {
      console.error('Error submitting question:', error);
      toast({
        title: "Error",
        description: "Failed to submit question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="question">Question *</Label>
        <Textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter the interview question..."
          required
          className="mt-1"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="additional-context">Additional Context</Label>
        <div className="mt-1">
          <RichTextEditor
            value={additionalContext}
            onChange={setAdditionalContext}
            placeholder="Add any additional context, code snippets, or images..."
            enableImagePaste={true}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="company">Company *</Label>
        <Input
          id="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company name..."
          className="mt-1"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="role">Role *</Label>
          <Select value={role} onValueChange={setRole} required>
            <SelectTrigger className="mt-1">
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

        <div>
          <Label htmlFor="interview_stage">Interview Stage</Label>
          <Select value={interviewStage} onValueChange={setInterviewStage}>
            <SelectTrigger className="mt-1">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Technical">Technical</SelectItem>
              <SelectItem value="Behavioral">Behavioral</SelectItem>
              <SelectItem value="System Design">System Design</SelectItem>
              <SelectItem value="Coding">Coding</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="subcategory">Subcategory</Label>
          <Input
            id="subcategory"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            placeholder="Subcategory (optional)..."
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="featured"
          checked={isFeatured}
          onCheckedChange={setIsFeatured}
        />
        <Label htmlFor="featured">Mark as featured question</Label>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Submitting..." : "Submit Question"}
      </Button>
    </form>
  );
};
