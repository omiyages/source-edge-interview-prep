import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Role } from '@/types/role';
import { Loader2, Upload, FileText, CheckCircle, X, Lock, LogIn, UserPlus } from 'lucide-react';

interface ApplyRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const ApplyRoleDialog = ({ open, onOpenChange, role }: ApplyRoleDialogProps) => {
  const { user, profile, loading: authLoading } = useAuth();
  const isAuthenticated = !authLoading && !!user;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ALLOWED_TYPES.includes(selected.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PDF or Word document.',
        variant: 'destructive',
      });
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      toast({
        title: 'File Too Large',
        description: 'Maximum file size is 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setFile(selected);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!fullName.trim()) {
      toast({ title: 'Required', description: 'Please enter your full name.', variant: 'destructive' });
      return;
    }
    if (!email.trim()) {
      toast({ title: 'Required', description: 'Please enter your email.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);

    try {
      let resumePath = '';

      // Upload CV to Supabase Storage
      if (file) {
        const ext = file.name.split('.').pop() || 'pdf';
        const storagePath = `${user.id}/${role.id}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('role-applications')
          .upload(storagePath, file, { contentType: file.type });

        if (uploadError) {
          throw new Error(`Failed to upload CV: ${uploadError.message}`);
        }

        resumePath = storagePath;
      }

      // Save application to database
      const { data: application, error: insertError } = await supabase
        .from('role_applications')
        .insert({
          role_id: role.id,
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          resume_path: resumePath || null,
          applied_by: user.id,
        } as any)
        .select('id')
        .single();

      if (insertError) {
        throw new Error(`Failed to save application: ${insertError.message}`);
      }

      // Send email notification to admin (fire-and-forget)
      supabase.functions
        .invoke('send-role-application', {
          body: {
            application_id: application?.id || '',
            role_title: role.job_title,
            company: role.company,
            full_name: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            resume_path: resumePath,
          },
        })
        .catch((err) => console.error('Email notification failed:', err));

      setSubmitted(true);
    } catch (err: any) {
      toast({
        title: 'Application Failed',
        description: err.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form after close animation
    setTimeout(() => {
      setSubmitted(false);
      setFile(null);
      setPhone('');
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {submitted ? 'Application Submitted' : `Apply for ${role.job_title}`}
          </DialogTitle>
        </DialogHeader>

        {!isAuthenticated ? (
          /* ---- Login wall: blurred form + overlay ---- */
          <div className="relative">
            {/* Blurred fake form */}
            <div className="blur-sm select-none pointer-events-none space-y-4" aria-hidden="true">
              <p className="text-sm text-muted-foreground">
                {role.company} &middot; {role.location}
              </p>
              <div className="space-y-1.5">
                <Label>Full Name *</Label>
                <Input placeholder="Your full name" readOnly tabIndex={-1} />
              </div>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input placeholder="you@example.com" readOnly tabIndex={-1} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input placeholder="+81 90-1234-5678" readOnly tabIndex={-1} />
              </div>
              <div className="space-y-1.5">
                <Label>Resume / CV *</Label>
                <div className="border-2 border-dashed border-neutral-700 rounded-md px-4 py-6 text-center">
                  <Upload className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload</p>
                </div>
              </div>
              <div className="h-11 bg-cyan-400 rounded-md" />
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-neutral-900 rounded-xl shadow-lg border border-neutral-800 px-6 py-6 max-w-xs w-full text-center">
                <div className="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">Sign in to Apply</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Create an account or sign in to submit your application.
                </p>
                <div className="flex gap-3">
                  <Button asChild className="flex-1 btn-cta">
                    <Link to="/auth" onClick={() => onOpenChange(false)}>
                      <LogIn className="w-4 h-4 mr-1.5" />
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link to="/signup" onClick={() => onOpenChange(false)}>
                      <UserPlus className="w-4 h-4 mr-1.5" />
                      Register
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-green-900/40 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">Thank you, {fullName}!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your application for <span className="font-medium">{role.job_title}</span> at{' '}
                <span className="font-medium">{role.company}</span> has been submitted successfully.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                We'll review your application and get back to you soon.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground -mt-2">
              {role.company} &middot; {role.location}
            </p>

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="apply-name">Full Name *</Label>
              <Input
                id="apply-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="apply-email">Email *</Label>
              <Input
                id="apply-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="apply-phone">Phone Number</Label>
              <Input
                id="apply-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+81 90-1234-5678"
              />
            </div>

            {/* CV Upload */}
            <div className="space-y-1.5">
              <Label>Resume / CV *</Label>
              {file ? (
                <div className="flex items-center gap-3 bg-neutral-800/50 border border-neutral-700 rounded-md px-3 py-2.5">
                  <FileText className="w-5 h-5 text-cyan-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-neutral-700 rounded-md px-4 py-6 text-center cursor-pointer hover:border-cyan-300 hover:bg-cyan-50/30 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF or Word &middot; Max 5MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full btn-cta h-11 text-base font-semibold"
              disabled={submitting || !file}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>

            <p className="text-[11px] text-muted-foreground text-center">
              By applying, you agree to share your information with the hiring team.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
