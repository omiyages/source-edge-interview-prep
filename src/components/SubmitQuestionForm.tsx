
// ABOUTME: Form component for submitting new interview questions with rich text support
// ABOUTME: Handles question creation with company, featured status, and rich additional context

import { useState, useEffect } from "react";
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
import { useEnhancedSecureInput } from "@/hooks/useEnhancedSecureInput";
import { Plus, FileText, User, Check, Sparkles, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface DropdownOptions {
  companies: string[];
  roles: string[];
  interview_stages: string[];
  categories: string[];
}

interface SubmitQuestionFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

const SectionHeader = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon className="h-4 w-4 text-primary shrink-0" />
    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{children}</span>
  </div>
);

export const SubmitQuestionForm = ({ onSuccess, onCancel }: SubmitQuestionFormProps) => {
  // Regular state for question input to prevent overwriting issues
  const [question, setQuestion] = useState("");
  const [questionError, setQuestionError] = useState("");
  
  // Secure input hook for context (rich text)
  const contextInput = useEnhancedSecureInput("", {
    maxLength: 10000,
    allowHtml: true,
  });

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [interviewStage, setInterviewStage] = useState("");
  const [category, setCategory] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState<DropdownOptions>({
    companies: [],
    roles: [],
    interview_stages: [],
    categories: []
  });
  
  // New option dialog states
  const [newOptionDialogOpen, setNewOptionDialogOpen] = useState(false);
  const [newOptionField, setNewOptionField] = useState("");
  const [newOptionValue, setNewOptionValue] = useState("");
  const [isAddingOption, setIsAddingOption] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();

  // Load dropdown options on component mount
  useEffect(() => {
    loadDropdownOptions();
  }, []);

  const loadDropdownOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('dropdown_options')
        .select('field_name, value')
        .order('value');

      if (error) throw error;

      const options: DropdownOptions = {
        companies: [],
        roles: [],
        interview_stages: [],
        categories: []
      };

      data?.forEach(item => {
        if (item.field_name === 'company') {
          options.companies.push(item.value);
        } else if (item.field_name === 'role') {
          options.roles.push(item.value);
        } else if (item.field_name === 'interview_stage') {
          options.interview_stages.push(item.value);
        } else if (item.field_name === 'category') {
          options.categories.push(item.value);
        }
      });

      setDropdownOptions(options);
    } catch (error) {
      console.error('Error loading dropdown options:', error);
    }
  };

  const handleAddNewOption = async () => {
    if (!newOptionField || !newOptionValue.trim()) {
      toast({
        title: "Error",
        description: "Please enter a value for the new option.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingOption(true);
    try {
      const { error } = await supabase
        .from('dropdown_options')
        .insert({
          field_name: newOptionField,
          value: newOptionValue.trim(),
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "New option added successfully.",
      });

      // Reload dropdown options
      await loadDropdownOptions();
      
      // Set the new value as selected
      if (newOptionField === 'company') setCompany(newOptionValue.trim());
      else if (newOptionField === 'role') setRole(newOptionValue.trim());
      else if (newOptionField === 'interview_stage') setInterviewStage(newOptionValue.trim());
      else if (newOptionField === 'category') setCategory(newOptionValue.trim());

      // Reset dialog
      setNewOptionDialogOpen(false);
      setNewOptionField("");
      setNewOptionValue("");
    } catch (error) {
      console.error('Error adding new option:', error);
      toast({
        title: "Error",
        description: "Failed to add new option. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingOption(false);
    }
  };

  const openNewOptionDialog = (field: string) => {
    setNewOptionField(field);
    setNewOptionDialogOpen(true);
  };

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

    if (!company || !role) {
      toast({
        title: "Error", 
        description: "Please select both company and role.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Validate question input
    if (!question.trim()) {
      setQuestionError("Question is required");
      setIsLoading(false);
      return;
    }

    if (question.length > 10000) {
      setQuestionError("Question must be less than 10,000 characters");
      setIsLoading(false);
      return;
    }

    setQuestionError("");

    try {
      // Use default values if no stage/category is selected
      const finalInterviewStage = interviewStage || 'Technical Screen';
      const finalCategory = category || 'Technical';

      const { error } = await supabase
        .from('interview_questions')
        .insert({
          question: question.trim(),
          company: company,
          role: role,
          interview_stage: finalInterviewStage,
          category: finalCategory,
          additional_context: contextInput.value || null,
          recommended: isFeatured,
          submitted_by: user.email,
          status: 'pending'
        });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      toast({
        title: "Success!",
        description: "Your question has been submitted for review.",
      });

      // Reset form
      setQuestion("");
      setQuestionError("");
      contextInput.reset();
      setCompany("");
      setRole("");
      setInterviewStage("");
      setCategory("");
      setIsFeatured(false);
      
      onSuccess();
    } catch (error) {
      console.error('Error submitting question:', error);
      toast({
        title: "Error",
        description: "Failed to submit question. Please try again.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const addOptionButtonClass = "h-9 w-9 shrink-0 rounded-full border border-input bg-background p-0 hover:bg-accent hover:text-accent-foreground";

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Section 1: Question Information */}
        <div className="space-y-4">
          <SectionHeader icon={FileText}>Question Information</SectionHeader>
          <div>
            <Label htmlFor="question">The Question *</Label>
            <div className="relative mt-1">
              <Textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. How would you design a scalable notification system?"
                required
                className={cn("min-h-[100px] pr-20 resize-none rounded-md", questionError && "border-destructive")}
                rows={4}
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-1 text-muted-foreground">
                {question.trim().length > 0 && (
                  <Check className="h-4 w-4 text-green-600" aria-hidden />
                )}
                <Sparkles className="h-4 w-4 opacity-70" aria-hidden />
              </div>
            </div>
            {questionError && (
              <p className="text-sm text-destructive mt-1">{questionError}</p>
            )}
          </div>
          <div>
            <Label htmlFor="company">Company *</Label>
            <div className="flex gap-2 mt-1">
              <Select value={company} onValueChange={setCompany} required>
                <SelectTrigger className="flex-1 rounded-md">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {dropdownOptions.companies.map((comp) => (
                    <SelectItem key={comp} value={comp}>{comp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" onClick={() => openNewOptionDialog('company')} className={addOptionButtonClass}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <div className="flex gap-2 mt-1">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="flex-1 rounded-md">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {dropdownOptions.categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" onClick={() => openNewOptionDialog('category')} className={addOptionButtonClass}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Section 2: Interview Details */}
        <div className="space-y-4">
          <SectionHeader icon={User}>Interview Details</SectionHeader>
          <div>
            <Label htmlFor="role">Role *</Label>
            <div className="flex gap-2 mt-1">
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger className="flex-1 rounded-md">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {dropdownOptions.roles.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" onClick={() => openNewOptionDialog('role')} className={addOptionButtonClass}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="interview_stage">Interview Stage</Label>
            <div className="flex gap-2 mt-1">
              <Select value={interviewStage} onValueChange={setInterviewStage}>
                <SelectTrigger className="flex-1 rounded-md">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {dropdownOptions.interview_stages.map((stage) => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" onClick={() => openNewOptionDialog('interview_stage')} className={addOptionButtonClass}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-transparent py-1">
            <div className="space-y-0.5">
              <Label htmlFor="featured" className="text-base font-normal cursor-pointer">Mark as featured question</Label>
              <p className="text-sm text-muted-foreground">High-quality questions will be highlighted to other candidates.</p>
            </div>
            <Switch id="featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
          </div>
        </div>

        {/* Section 3: Additional Context */}
        <div className="space-y-4">
          <SectionHeader icon={FileText}>Additional Context</SectionHeader>
          <div>
            <RichTextEditor
              value={contextInput.value}
              onChange={contextInput.setValue}
              placeholder="Add any additional context, code snippets, or images..."
              enableImagePaste={true}
              className={cn("overflow-hidden rounded-md", !contextInput.isValid && "border-destructive")}
            />
            {contextInput.errors.length > 0 && (
              <p className="text-sm text-destructive mt-1">{contextInput.errors.join(", ")}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {isLoading ? "Submitting..." : "Submit Question"}
            {!isLoading && <Send className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </form>

      {/* New Option Dialog */}
      <Dialog open={newOptionDialogOpen} onOpenChange={setNewOptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Option</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-option-value">
                New {newOptionField?.replace('_', ' ')} Value
              </Label>
              <Input
                id="new-option-value"
                value={newOptionValue}
                onChange={(e) => setNewOptionValue(e.target.value)}
                placeholder="Enter new value..."
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleAddNewOption}
                disabled={isAddingOption}
                className="flex-1"
              >
                {isAddingOption ? "Adding..." : "Add Option"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewOptionDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
