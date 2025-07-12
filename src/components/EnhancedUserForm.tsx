import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Plus, Loader2, Download } from 'lucide-react';

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(1, 'Full name is required'),
  linkedin_profile: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  current_company: z.string().optional(),
  years_of_experience: z.number().min(0).max(50).optional(),
  phone_number: z.string().optional(),
  salary: z.number().min(0).optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface EnhancedUserFormProps {
  user?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EnhancedUserForm: React.FC<EnhancedUserFormProps> = ({
  user,
  onSuccess,
  onCancel,
}) => {
  const [skillsets, setSkillsets] = useState<string[]>(user?.skillsets || []);
  const [pastCompanies, setPastCompanies] = useState<string[]>(user?.past_companies || []);
  const [notes, setNotes] = useState<string[]>(user?.notes || []);
  const [newSkill, setNewSkill] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: user?.email || '',
      full_name: user?.full_name || '',
      linkedin_profile: user?.linkedin_profile || '',
      current_company: user?.current_company || '',
      years_of_experience: user?.years_of_experience || undefined,
      phone_number: user?.phone_number || '',
      salary: user?.salary || undefined,
    },
  });

  const linkedinUrl = watch('linkedin_profile');

  const addSkill = () => {
    if (newSkill.trim() && !skillsets.includes(newSkill.trim())) {
      setSkillsets([...skillsets, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkillsets(skillsets.filter(s => s !== skill));
  };

  const addCompany = () => {
    if (newCompany.trim() && !pastCompanies.includes(newCompany.trim())) {
      setPastCompanies([...pastCompanies, newCompany.trim()]);
      setNewCompany('');
    }
  };

  const removeCompany = (company: string) => {
    setPastCompanies(pastCompanies.filter(c => c !== company));
  };

  const addNote = () => {
    if (newNote.trim()) {
      setNotes([...notes, newNote.trim()]);
      setNewNote('');
    }
  };

  const removeNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
  };

  const importFromLinkedIn = async () => {
    if (!linkedinUrl) {
      toast.error('Please enter a LinkedIn URL first');
      return;
    }

    setIsImporting(true);
    try {
      // Call edge function to scrape LinkedIn data
      const { data, error } = await supabase.functions.invoke('scrape-linkedin', {
        body: { url: linkedinUrl }
      });

      if (error) throw error;

      if (data) {
        // Auto-fill form with scraped data
        if (data.name) setValue('full_name', data.name);
        if (data.company) setValue('current_company', data.company);
        if (data.experience) setValue('years_of_experience', data.experience);
        if (data.skills) setSkillsets(data.skills);
        if (data.pastCompanies) setPastCompanies(data.pastCompanies);
        
        toast.success('LinkedIn data imported successfully');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import LinkedIn data. Please fill manually.');
    } finally {
      setIsImporting(false);
    }
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      const userData = {
        ...data,
        skillsets: skillsets.length > 0 ? skillsets : null,
        past_companies: pastCompanies.length > 0 ? pastCompanies : null,
        notes: notes.length > 0 ? notes : null,
        years_of_experience: data.years_of_experience || null,
        salary: data.salary || null,
      };

      if (user) {
        // Update existing user
        const { error } = await supabase
          .from('profiles')
          .update(userData)
          .eq('id', user.id);

        if (error) throw error;
        toast.success('User updated successfully');
      } else {
        // Create new user
        const { error } = await supabase.auth.admin.createUser({
          email: data.email,
          email_confirm: true,
          user_metadata: {
            full_name: data.full_name,
          },
        });

        if (error) throw error;
        toast.success('User created successfully');
      }

      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save user');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{user ? 'Edit Candidate' : 'Add New Candidate'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  {...register('email')}
                  disabled={!!user}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  {...register('full_name')}
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive">{errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  {...register('phone_number')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Salary Expectation</Label>
                <Input
                  id="salary"
                  type="number"
                  {...register('salary', { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* LinkedIn & Professional Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Professional Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="linkedin_profile">LinkedIn Profile</Label>
              <div className="flex gap-2">
                <Input
                  id="linkedin_profile"
                  {...register('linkedin_profile')}
                  placeholder="https://linkedin.com/in/username"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={importFromLinkedIn}
                  disabled={isImporting || !linkedinUrl}
                  className="shrink-0"
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Import
                </Button>
              </div>
              {errors.linkedin_profile && (
                <p className="text-sm text-destructive">{errors.linkedin_profile.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current_company">Current Company</Label>
                <Input
                  id="current_company"
                  {...register('current_company')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="years_of_experience">Years of Experience</Label>
                <Input
                  id="years_of_experience"
                  type="number"
                  min="0"
                  max="50"
                  {...register('years_of_experience', { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Skills */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Skills</h3>
            
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <Button type="button" onClick={addSkill} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {skillsets.map((skill) => (
                <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Past Companies */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Past Companies</h3>
            
            <div className="flex gap-2">
              <Input
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                placeholder="Add a past company"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompany())}
              />
              <Button type="button" onClick={addCompany} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {pastCompanies.map((company) => (
                <Badge key={company} variant="outline" className="flex items-center gap-1">
                  {company}
                  <button
                    type="button"
                    onClick={() => removeCompany(company)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notes</h3>
            
            <div className="flex gap-2">
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note"
                rows={2}
              />
              <Button type="button" onClick={addNote} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {notes.map((note, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded">
                  <p className="flex-1 text-sm">{note}</p>
                  <button
                    type="button"
                    onClick={() => removeNote(index)}
                    className="hover:bg-destructive/20 rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {user ? 'Update' : 'Create'} Candidate
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};