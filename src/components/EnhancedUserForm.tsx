import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Download } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserProfile } from "@/types/user";
import { scrapeLinkedInProfile } from "@/utils/linkedinScraper";

interface EnhancedUserFormData {
  full_name: string;
  email: string;
  phone_number?: string;
  current_company?: string;
  years_of_experience?: number;
  salary?: number;
  linkedin_profile?: string;
  skillsets?: string[];
  past_companies?: string[];
  notes?: string[];
  is_active: boolean;
  role: 'user' | 'admin';
}

interface EnhancedUserFormProps {
  user?: UserProfile | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EnhancedUserForm = ({ user, onSuccess, onCancel }: EnhancedUserFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for dynamic arrays
  const [skills, setSkills] = useState<string[]>(user?.skillsets || []);
  const [companies, setCompanies] = useState<string[]>(user?.past_companies || []);
  const [userNotes, setUserNotes] = useState<string[]>(user?.notes || []);
  const [newSkill, setNewSkill] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newNote, setNewNote] = useState("");
  const [isScrapingLinkedIn, setIsScrapingLinkedIn] = useState(false);

  const form = useForm<EnhancedUserFormData>({
    defaultValues: {
      full_name: user?.full_name || "",
      email: user?.email || "",
      phone_number: user?.phone_number || "",
      current_company: user?.current_company || "",
      years_of_experience: user?.years_of_experience || undefined,
      salary: user?.salary || undefined,
      linkedin_profile: user?.linkedin_profile || "",
      skillsets: user?.skillsets || [],
      past_companies: user?.past_companies || [],
      notes: user?.notes || [],
      is_active: user?.is_active ?? true,
      role: (user?.role === 'admin' ? 'admin' : 'user') as 'user' | 'admin',
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: EnhancedUserFormData) => {
      const updateData = {
        ...data,
        skillsets: skills,
        past_companies: companies,
        notes: userNotes,
        updated_at: new Date().toISOString(),
      };

      if (user?.id) {
        // Update existing user
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id);
        
        if (error) throw error;
      } else {
        // Create new user through edge function
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData?.session?.access_token) {
          throw new Error('Please sign in again - no valid session');
        }

        const payload = {
          email: data.email.trim().toLowerCase(),
          password: 'TempPassword123!', // Temporary password for admin-created users
          fullName: data.full_name.trim(),
          role: data.role,
          ...updateData
        };

        const response = await fetch(`https://satshobhbkjptsbmfsia.supabase.co/functions/v1/admin-user-management`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdHNob2JoYmtqcHRzYm1mc2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDI5NjUsImV4cCI6MjA2NjMxODk2NX0.T_q1HFL4SQEdzjWjJtfX9WRiHjQLK5WaoH8bCKsLP2c',
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        if (result.error) {
          throw new Error(result.error);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "Success!",
        description: user ? "User updated successfully" : "User created successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Error saving user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save user",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: EnhancedUserFormData) => {
    updateUserMutation.mutate(data);
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const addCompany = () => {
    if (newCompany.trim() && !companies.includes(newCompany.trim())) {
      setCompanies([...companies, newCompany.trim()]);
      setNewCompany("");
    }
  };

  const removeCompany = (companyToRemove: string) => {
    setCompanies(companies.filter(company => company !== companyToRemove));
  };

  const addNote = () => {
    if (newNote.trim()) {
      setUserNotes([...userNotes, newNote.trim()]);
      setNewNote("");
    }
  };

  const removeNote = (index: number) => {
    setUserNotes(userNotes.filter((_, i) => i !== index));
  };

  const handleLinkedInScrape = async () => {
    const linkedinUrl = form.getValues('linkedin_profile');
    
    if (!linkedinUrl || !linkedinUrl.includes('linkedin.com')) {
      toast({
        title: "Invalid LinkedIn URL",
        description: "Please enter a valid LinkedIn profile URL first",
        variant: "destructive",
      });
      return;
    }

    setIsScrapingLinkedIn(true);
    
    try {
      const profileData = await scrapeLinkedInProfile(linkedinUrl);
      
      if (profileData) {
        // Update form fields with scraped data
        if (profileData.name && !form.getValues('full_name')) {
          form.setValue('full_name', profileData.name);
        }
        
        if (profileData.company && !form.getValues('current_company')) {
          form.setValue('current_company', profileData.company);
        }
        
        if (profileData.experience && !form.getValues('years_of_experience')) {
          form.setValue('years_of_experience', profileData.experience);
        }
        
        // Update skills if not already set
        if (profileData.skills && profileData.skills.length > 0 && skills.length === 0) {
          setSkills(profileData.skills);
        }
        
        // Update past companies if not already set
        if (profileData.pastCompanies && profileData.pastCompanies.length > 0 && companies.length === 0) {
          setCompanies(profileData.pastCompanies);
        }
        
        // Add scraped note
        if (profileData.note) {
          setUserNotes([...userNotes, profileData.note]);
        }
        
        toast({
          title: "LinkedIn Profile Imported",
          description: "Profile information has been imported from LinkedIn",
        });
      }
    } catch (error) {
      console.error('LinkedIn scraping failed:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import LinkedIn profile information",
        variant: "destructive",
      });
    } finally {
      setIsScrapingLinkedIn(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="full_name"
            rules={{ required: "Full name is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            rules={{ 
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address"
              }
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="current_company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Company</FormLabel>
                <FormControl>
                  <Input placeholder="Enter current company" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="years_of_experience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Years of Experience</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter years of experience" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salary Expectation</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter salary expectation" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="linkedin_profile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>LinkedIn Profile</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input placeholder="Enter LinkedIn profile URL" {...field} />
                </FormControl>
                <Button
                  type="button"
                  onClick={handleLinkedInScrape}
                  disabled={isScrapingLinkedIn || !field.value}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isScrapingLinkedIn ? "Importing..." : "Import"}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Skills Section */}
        <div>
          <FormLabel>Skills</FormLabel>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Add a skill"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            />
            <Button type="button" onClick={addSkill} variant="outline" size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {skill}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => removeSkill(skill)}
                />
              </Badge>
            ))}
          </div>
        </div>

        {/* Past Companies Section */}
        <div>
          <FormLabel>Past Companies</FormLabel>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Add a past company"
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompany())}
            />
            <Button type="button" onClick={addCompany} variant="outline" size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {companies.map((company, index) => (
              <Badge key={index} variant="outline" className="flex items-center gap-1">
                {company}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => removeCompany(company)}
                />
              </Badge>
            ))}
          </div>
        </div>

        {/* Notes Section */}
        <div>
          <FormLabel>Notes</FormLabel>
          <div className="flex gap-2 mb-2">
            <Textarea
              placeholder="Add a note"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={2}
            />
            <Button type="button" onClick={addNote} variant="outline" size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {userNotes.map((note, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                <span className="flex-1 text-sm">{note}</span>
                <X 
                  className="w-4 h-4 cursor-pointer text-gray-500 hover:text-red-500" 
                  onClick={() => removeNote(index)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={(value) => field.onChange(value === 'true')} defaultValue={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={updateUserMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={updateUserMutation.isPending}
            className="bg-purple-gradient hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 transition-all duration-300 text-white font-medium"
          >
            {updateUserMutation.isPending ? "Saving..." : user ? "Update User" : "Create User"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
