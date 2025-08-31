// ABOUTME: Form component for editing interview questions with rich text support
// ABOUTME: Provides comprehensive question editing with dynamic dropdown options and add new option functionality

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InterviewQuestion {
  id: string;
  question: string;
  company: string;
  role: string;
  interview_stage: string;
  category: string;
  submitted_by: string | null;
  additional_context: string | null;
  created_at: string;
  question_type: string;
  source_url: string | null;
  source_website: string | null;
  scraped_at: string | null;
  status?: string;
  team: string | null;
  position_name: string | null;
  recommended?: boolean;
}

interface EditQuestionFormProps {
  question: InterviewQuestion;
  onSuccess: () => void;
}

interface DropdownOptions {
  companies: string[];
  roles: string[];
  interview_stages: string[];
  categories: string[];
}

export const EditQuestionForm = ({ question, onSuccess }: EditQuestionFormProps) => {
  const [formData, setFormData] = useState({
    question: question.question,
    company: question.company,
    role: question.role,
    interview_stage: question.interview_stage,
    category: question.category,
    additional_context: question.additional_context || "",
    team: question.team || "",
    position_name: question.position_name || "",
    recommended: question.recommended || false,
  });

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
  const queryClient = useQueryClient();

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
      if (newOptionField === 'company') setFormData(prev => ({ ...prev, company: newOptionValue.trim() }));
      else if (newOptionField === 'role') setFormData(prev => ({ ...prev, role: newOptionValue.trim() }));
      else if (newOptionField === 'interview_stage') setFormData(prev => ({ ...prev, interview_stage: newOptionValue.trim() }));
      else if (newOptionField === 'category') setFormData(prev => ({ ...prev, category: newOptionValue.trim() }));

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

  const updateQuestionMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const { error } = await supabase
        .from('interview_questions')
        .update(updatedData)
        .eq('id', question.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-questions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-questions'] });
      toast({
        title: "Question Updated",
        description: "The question has been successfully updated.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update question: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuestionMutation.mutate(formData);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="question">Question *</Label>
          <Textarea
            id="question"
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            placeholder="Enter the interview question..."
            required
            className="mt-1"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="company">Company *</Label>
          <div className="flex gap-2 mt-1">
            <Select value={formData.company} onValueChange={(value) => setFormData({ ...formData, company: value })} required>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {dropdownOptions.companies.map((comp) => (
                  <SelectItem key={comp} value={comp}>
                    {comp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openNewOptionDialog('company')}
              className="px-3"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="role">Role *</Label>
            <div className="flex gap-2 mt-1">
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })} required>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {dropdownOptions.roles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openNewOptionDialog('role')}
                className="px-3"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="interview_stage">Interview Stage</Label>
            <div className="flex gap-2 mt-1">
              <Select value={formData.interview_stage} onValueChange={(value) => setFormData({ ...formData, interview_stage: value })}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {dropdownOptions.interview_stages.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openNewOptionDialog('interview_stage')}
                className="px-3"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <div className="flex gap-2 mt-1">
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {dropdownOptions.categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openNewOptionDialog('category')}
              className="px-3"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="team">Team</Label>
            <Input
              id="team"
              value={formData.team}
              onChange={(e) => setFormData({ ...formData, team: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="position_name">Position Name</Label>
            <Input
              id="position_name"
              value={formData.position_name}
              onChange={(e) => setFormData({ ...formData, position_name: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="recommended" className="text-sm font-medium">
            Mark as featured question
          </Label>
          <Switch
            id="recommended"
            checked={formData.recommended}
            onCheckedChange={(checked) => setFormData({ ...formData, recommended: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="additional-context">Additional Context</Label>
          <div className="min-h-[250px]">
            <RichTextEditor
              value={formData.additional_context}
              onChange={(value) => setFormData({ ...formData, additional_context: value })}
              placeholder="Add any additional context, code snippets, or images..."
              enableImagePaste={true}
            />
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={updateQuestionMutation.isPending} className="w-full">
            {updateQuestionMutation.isPending ? "Updating..." : "Update Question"}
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
